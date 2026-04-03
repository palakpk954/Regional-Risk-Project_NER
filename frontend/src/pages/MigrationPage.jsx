import { useEffect, useMemo, useState } from 'react';
import { FileUp, Sheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Input from '../components/Input';
import PageContainer from '../components/PageContainer';
import SectionHeader from '../components/SectionHeader';
import Skeleton from '../components/ui/Skeleton';
import { importRowsFromGoogleSheetUrl, mockGoogleSheetData, parseCsvContent } from '../services/migrationService';
import { usePlacementStore } from '../store/usePlacementStore';

export default function MigrationPage() {
  const navigate = useNavigate();
  const runMigrationImportFromRows = usePlacementStore((state) => state.runMigrationImportFromRows);
  const engine = usePlacementStore((state) => state.engine);
  const migrationPreviewRows = usePlacementStore((state) => state.migrationPreviewRows);
  const migrationImportMeta = usePlacementStore((state) => state.migrationImportMeta);
  const migrationSource = usePlacementStore((state) => state.migrationSource);
  const migrationErrors = usePlacementStore((state) => state.migrationErrors);
  const loading = usePlacementStore((state) => state.loading);

  const [sheetUrl, setSheetUrl] = useState('');
  const [csvError, setCsvError] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    setCurrentPage(1);
  }, [migrationPreviewRows.length, rowsPerPage]);

  const totalRows = migrationPreviewRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const visibleRows = migrationPreviewRows.slice(startIndex, endIndex);

  const summary = useMemo(
    () => ({
      students: engine.kpis.totalStudents,
      placed: engine.kpis.placedStudents,
      companies: new Set(
        engine.records
          .map((row) => row.company)
          .filter((company) => company && company !== 'Unassigned'),
      ).size,
      applications: engine.records.filter((row) => row.company && row.company !== 'Unassigned').length,
    }),
    [engine],
  );

  const handleRows = async (payload) => {
    await runMigrationImportFromRows(payload.students, payload.sourceName, {
      rawRows: payload.rawRows,
      cleanedRows: payload.cleanedRows,
    });
  };

  const parseCsvFile = async (file) => {
    try {
      setCsvError('');
      const payload = await parseCsvContent(file);
      await handleRows(payload);
    } catch (error) {
      setCsvError(error.message || 'Invalid CSV file. Please check headers and values.');
    }
  };

  const importFromSheet = async () => {
    try {
      setSheetLoading(true);
      setSheetError('');
      const payload = await importRowsFromGoogleSheetUrl(sheetUrl);
      await handleRows(payload);
    } catch (error) {
      setSheetError(error.message || 'Failed to import sheet data.');
    } finally {
      setSheetLoading(false);
    }
  };

  const importMockSheet = async () => {
    const payload = mockGoogleSheetData(sheetUrl || 'mock://sheet');
    await handleRows({
      ...payload,
      sourceName: `${payload.sourceName} (mock)`,
    });
  };

  const previewColumns = useMemo(() => {
    const row = migrationPreviewRows[0];
    if (!row) return [];
    const orderedKeys = ['name', 'email', 'cgpa', 'branch', 'company', 'status'];
    return orderedKeys.filter((key) => key in row).map((key) => ({ key, label: key }));
  }, [migrationPreviewRows]);

  const previewRows = useMemo(() => {
    return visibleRows.map((row, index) => ({ id: `preview_${startIndex + index}`, ...row }));
  }, [visibleRows, startIndex]);

  return (
    <PageContainer className='space-y-8'>
      <SectionHeader
        title='Input Layer'
        subtitle='Upload CSV or pull Google Sheet rows. Engine processing starts immediately after import.'
      />

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='card-hover'>
          <h3 className='text-base font-semibold text-slate-900'>CSV Upload</h3>
          <p className='mt-1 text-sm text-slate-500'>Upload any placement sheet with columns such as name, branch, company, cgpa, status.</p>

          <label className='mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50'>
            <FileUp className='h-6 w-6 text-slate-500' />
            <span className='mt-2 text-sm font-medium text-slate-700'>Click to upload CSV</span>
            <input
              type='file'
              accept='.csv'
              className='hidden'
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void parseCsvFile(file);
                }
              }}
            />
          </label>

          {csvError ? <p className='mt-3 text-xs text-rose-600'>{csvError}</p> : null}
        </Card>

        <Card className='card-hover'>
          <h3 className='text-base font-semibold text-slate-900'>Google Sheet Input</h3>
          <p className='mt-1 text-sm text-slate-500'>Use public sheet link, or run demo import with mock sheet rows.</p>

          <div className='mt-4 space-y-3'>
            <Input
              placeholder='https://docs.google.com/spreadsheets/...'
              value={sheetUrl}
              onChange={(event) => setSheetUrl(event.target.value)}
            />
            {sheetError ? <p className='text-xs text-rose-600'>{sheetError}</p> : null}
            <div className='flex gap-2'>
              <Button className='flex-1' onClick={importFromSheet} disabled={!sheetUrl || sheetLoading}>
                {sheetLoading ? 'Importing...' : 'Import Sheet'}
              </Button>
              <Button variant='secondary' className='flex-1' onClick={importMockSheet}>
                <Sheet className='h-4 w-4' />
                Use Mock
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className='card-hover'>
        <SectionHeader
          title='Processing Output'
          subtitle={migrationSource ? `Latest source: ${migrationSource}` : 'No dataset imported yet'}
        />

        {loading || sheetLoading ? (
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-6'>
            <p className='mb-3 text-sm text-slate-600'>Processing rows through placement engine...</p>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-1/2' />
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-4 w-1/3' />
            </div>
          </div>
        ) : null}

        <div className='mb-4 grid gap-3 md:grid-cols-4'>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm'>Students: {summary.students}</div>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm'>Placed: {summary.placed}</div>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm'>Companies: {summary.companies}</div>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm'>Records with company: {summary.applications}</div>
        </div>

        <div className='mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
          Raw rows read: <span className='font-semibold'>{migrationImportMeta?.rawRows ?? totalRows}</span> | Clean unique students: <span className='font-semibold'>{migrationImportMeta?.cleanedRows ?? summary.students}</span> | Showing {totalRows ? startIndex + 1 : 0}-{Math.min(endIndex, totalRows)} of {totalRows}
        </div>

        {summary.companies > 0 ? (
          <div className='mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800'>
            Auto company intelligence matched {engine.companyIntelligence.detectedTopTechCompanies}/{engine.companyIntelligence.totalDistinctCompanies} companies against {engine.companyIntelligence.catalogSize}+ tech-company signatures.
          </div>
        ) : null}

        {summary.students > 0 ? (
          <div className='mb-4 flex flex-wrap gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3'>
            <Button size='sm' onClick={() => navigate('/')}>
              Open Dashboard
            </Button>
            <Button size='sm' variant='secondary' onClick={() => navigate('/simulator')}>
              Jump To Simulator
            </Button>
            <p className='self-center text-xs text-indigo-700'>Demo flow: Upload {'->'} Dashboard {'->'} Simulator {'->'} Reports</p>
          </div>
        ) : null}

        {migrationErrors.length > 0 ? (
          <div className='mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700'>
            {migrationErrors.slice(0, 6).map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        ) : null}

        {previewColumns.length > 0 ? (
          <>
            <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
              <div className='text-xs text-slate-500'>Page {safePage} of {totalPages}</div>
              <div className='flex items-center gap-2'>
                <label className='text-xs text-slate-500'>Rows per page</label>
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className='h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <Button size='sm' variant='secondary' onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage <= 1}>
                  Prev
                </Button>
                <Button size='sm' variant='secondary' onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
            <DataTable columns={previewColumns} rows={previewRows} />
          </>
        ) : (
          <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500'>
            Empty state: upload a CSV or import sheet rows to begin processing.
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
