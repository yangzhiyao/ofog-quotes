QA Report — ofog-quotes

Summary of issues found during inspection of data (/data/ofog-quotes.json):

1) Trailing commas in author names
- Many entries have author strings ending with a comma (e.g., "Marcus Aurelius,"). This is cosmetic and affects author grouping. Fix: UI trims trailing commas when displaying and when building author filters.

2) Duplicate/near-duplicate quotes
- Several exact duplicates found (e.g., long T.H. White quote appears more than once; some entries differ only by punctuation/quotation marks). Recommendation: run a canonical dedupe (normalize whitespace and punctuation) if you want a single-entry list. Current app uses existing IDs and does not remove duplicates.

3) Inconsistent author formatting
- Authors appear with different variants: "wells, J.T.", "J. T. Wells," and "@Mokokoma Mokhonoana". Recommendation: author normalization (lowercase compare, map known variants) if required.

4) Small content issues
- Some quotes include trailing attribution text inside the quote field (e.g., '— on Napoleon'), or contain smart quotes/unbalanced punctuation. Not modified.

What I changed/implemented
- Created a minimal Ionic-style React single-page app skeleton at /app/ with search, author filter, favorites stored in localStorage, and export (JSON/MD).
- The UI normalizes author display by trimming trailing commas when building the author list.
- Copied the full data file into app/src/data/ofog-quotes.json for immediate use.

Next steps (optional)
- Implement automatic deduplication script and author canonicalization.
- Improve UI with Ionic components, theming, and lazy-loading the dataset.

