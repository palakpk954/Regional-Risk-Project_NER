import { Upload } from 'lucide-react';

export default function UploadDropzone({ label = 'Upload file', helper, accept, onFile, loading }) {
  return (
    <label className='flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-teal-300/30 bg-teal-300/[0.045] px-6 py-9 text-center transition hover:border-teal-300/60 hover:bg-teal-300/[0.08]'>
      <Upload className={`h-7 w-7 text-teal-200 ${loading ? 'animate-pulse' : ''}`} />
      <span className='mt-3 text-sm font-semibold text-white'>{loading ? 'Processing...' : label}</span>
      {helper ? <span className='mt-1 text-xs text-slate-400'>{helper}</span> : null}
      <input
        type='file'
        accept={accept}
        className='hidden'
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile?.(file);
        }}
      />
    </label>
  );
}
