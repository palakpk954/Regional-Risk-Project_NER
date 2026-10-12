import pypandoc
import os

print("Downloading Pandoc (this may take a moment)...")
pypandoc.download_pandoc()

print("Converting Markdown to Word (.docx)...")
md_file = r"c:\Users\HP\Desktop\Research wokr\Thesis_Final.md"
docx_file = r"c:\Users\HP\Desktop\Research wokr\Thesis_Final_v2.docx"

pypandoc.convert_file(md_file, 'docx', outputfile=docx_file)
print(f"Success! Saved Word file to: {docx_file}")
