import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Calculator,
  Download,
  FileSpreadsheet,
  FileUp,
  Filter,
  Replace,
  Search,
  Sigma,
  Sparkles,
  TableProperties,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import TiltCard from '../components/TiltCard';

type ParsedRow = {
  rowNumber: number;
  values: string[];
};

type ParsedSheet = {
  name: string;
  headers: string[];
  rows: ParsedRow[];
};

type ParsedWorkbook = {
  fileName: string;
  sheets: ParsedSheet[];
};

type FormulaGuide = {
  id: string;
  name: string;
  syntax: string;
  description: string;
  example: string;
  category: string;
  source: string;
};

type PlaygroundState = {
  numbers: string;
  countifValues: string;
  countifCriteria: string;
  sumifCriteriaRange: string;
  sumifCriteria: string;
  sumifValues: string;
  ifValue: string;
  ifOperator: string;
  ifCompareTo: string;
  ifTrueValue: string;
  ifFalseValue: string;
  concatFirst: string;
  concatSecond: string;
  concatDelimiter: string;
};

type LookupResult = {
  query: string;
  matchValue: string;
  rowNumber: number | null;
  found: boolean;
  matchedBy: string;
  matchCount: number;
  allMatchesPreview: string;
};

type DuplicateRowResult = {
  rowNumber: number;
  value: string;
  duplicateCount: number;
  duplicate: boolean;
  row: ParsedRow;
};

type LookupResultMode = 'first' | 'all';
type MatchMode = 'exact' | 'contains' | 'startsWith';

type FilterRule = {
  columnIndex: number;
  mode: MatchMode;
  value: string;
};

type ReplacePreviewRow = {
  rowNumber: number;
  before: string;
  after: string;
  changed: boolean;
};

type RecipeDefinition = {
  id: string;
  title: string;
  description: string;
};

type SavedRecipe = {
  id: string;
  name: string;
  lookupColumnIndex: number;
  returnColumnIndex: number;
  lookupMode: LookupMode;
  lookupResultMode: LookupResultMode;
  duplicateSelectedColumns: number[];
  filters: FilterRule[];
  replaceColumnIndex: number;
  replaceMode: MatchMode;
  replaceFindValue: string;
  replaceWithValue: string;
};

type CompareResult = {
  key: string;
  primaryValue: string;
  secondaryValue: string;
  status: 'match' | 'mismatch' | 'missing_in_secondary' | 'missing_in_primary';
};

const formulaGuides: FormulaGuide[] = [
  {
    id: 'vlookup',
    name: 'VLOOKUP',
    syntax: '=VLOOKUP(lookup_value, table_array, col_index_num, FALSE)',
    description: 'Tìm một giá trị trong cột đầu tiên của bảng và trả về dữ liệu ở cột khác trên cùng hàng.',
    example: '=VLOOKUP(A2,$F$2:$H$100,2,FALSE)',
    category: 'Tra cứu',
    source: 'https://support.microsoft.com/en-us/office/collaborate-b2054e75-e999-4146-8f46-159c4364a6aa',
  },
  {
    id: 'sum',
    name: 'SUM',
    syntax: '=SUM(number1, [number2], ...)',
    description: 'Cộng nhanh danh sách số hoặc vùng ô.',
    example: '=SUM(B2:B20)',
    category: 'Tính toán',
    source: 'https://support.microsoft.com/en-us/office/learn-more-about-sum-e8e46d7a-716a-414f-b59f-1073231ec0db',
  },
  {
    id: 'if',
    name: 'IF',
    syntax: '=IF(logical_test, value_if_true, value_if_false)',
    description: 'Kiểm tra điều kiện và trả về 2 nhánh kết quả.',
    example: '=IF(C2>=1000000,"Đạt","Chưa đạt")',
    category: 'Logic',
    source: 'https://support.microsoft.com/en-us/office/if-function-69aed7c9-4e8a-4755-a9bc-aa8bbff73be2',
  },
  {
    id: 'countif',
    name: 'COUNTIF',
    syntax: '=COUNTIF(range, criteria)',
    description: 'Đếm số ô thỏa một điều kiện.',
    example: '=COUNTIF(A:A,"Nam")',
    category: 'Thống kê',
    source: 'https://support.microsoft.com/en-us/office/countif-function-e0de10c6-f885-4e71-abb4-1f464816df34',
  },
  {
    id: 'sumif',
    name: 'SUMIF',
    syntax: '=SUMIF(range, criteria, [sum_range])',
    description: 'Cộng các giá trị tương ứng khi một điều kiện được thỏa.',
    example: '=SUMIF(B:B,"Cy",C:C)',
    category: 'Thống kê',
    source: 'https://support.microsoft.com/en-us/office/sumif-function-169b8c99-c05c-4483-a712-1697a653039b',
  },
  {
    id: 'concat',
    name: 'CONCAT',
    syntax: '=CONCAT(text1, [text2], ...)',
    description: 'Ghép nhiều đoạn text lại với nhau.',
    example: '=CONCAT(A2," - ",B2)',
    category: 'Text',
    source: 'https://support.microsoft.com/en-us/office/concat-function-9b1a9a3f-94ff-41af-9736-694cbd6b4ca2',
  },
];

const demoGifs = [
  {
    title: 'Mở nhanh bảng tính và nhập dữ liệu',
    description: 'GIF tham khảo thao tác làm việc với bảng tính và nhập liệu trong Excel.',
    embedUrl: 'https://giphy.com/embed/1ZDxS012XuY0ROBzyj',
    source: 'https://giphy.com/gifs/office-excel-help-1ZDxS012XuY0ROBzyj',
  },
  {
    title: 'Thao tác trực quan trên trang tính',
    description: 'GIF tham khảo cho cảm giác thao tác trực tiếp với ô và vùng dữ liệu.',
    embedUrl: 'https://giphy.com/embed/fasjTJwTFW2goeR2uV',
    source: 'https://giphy.com/gifs/MicrosoftCloud-heart-microsoft-msignite-fasjTJwTFW2goeR2uV',
  },
  {
    title: 'Rà soát nhiều sheet và dữ liệu lớn',
    description: 'GIF tham khảo cho luồng xem, rà soát và xử lý nhiều vùng dữ liệu.',
    embedUrl: 'https://giphy.com/embed/XC1Lqj7rtyYeQ48TuH',
    source: 'https://giphy.com/gifs/mmhmmsocial-ahhhh-zoom-takeover-too-many-sheets-XC1Lqj7rtyYeQ48TuH',
  },
];

const defaultPlaygroundState: PlaygroundState = {
  numbers: '120000, 450000, 30000',
  countifValues: 'Nam, Cy, Nam, Huy, Nam',
  countifCriteria: 'Nam',
  sumifCriteriaRange: 'Nam, Cy, Nam, Huy',
  sumifCriteria: 'Nam',
  sumifValues: '100000, 300000, 250000, 50000',
  ifValue: '1200000',
  ifOperator: '>=',
  ifCompareTo: '1000000',
  ifTrueValue: 'Đạt KPI',
  ifFalseValue: 'Chưa đạt',
  concatFirst: 'Cy',
  concatSecond: 'làm việc nhanh hơn',
  concatDelimiter: ' - ',
};

const lookupModes = [
  {
    value: 'exact',
    label: 'Khớp chính xác',
    description: 'Giống VLOOKUP chuẩn với so khớp tuyệt đối.',
  },
  {
    value: 'contains',
    label: 'Chứa nội dung',
    description: 'Tìm khi ô dữ liệu có chứa chuỗi bạn nhập.',
  },
  {
    value: 'startsWith',
    label: 'Bắt đầu bằng',
    description: 'Khớp khi dữ liệu bắt đầu với chuỗi cần tìm.',
  },
] as const;

type LookupMode = (typeof lookupModes)[number]['value'];

const matchModeOptions: Array<{ value: MatchMode; label: string }> = [
  { value: 'exact', label: 'Khớp chính xác' },
  { value: 'contains', label: 'Chứa nội dung' },
  { value: 'startsWith', label: 'Bắt đầu bằng' },
];

const demoWorkbookRows = [
  ['Mã NV', 'Tên', 'Phòng ban', 'Lương'],
  ['NV001', 'Cy', 'Vận hành', 12000000],
  ['NV002', 'Nam', 'Kinh doanh', 18000000],
  ['NV003', 'Linh', 'Vận hành', 12500000],
  ['NV004', 'Cy', 'Hỗ trợ', 11500000],
  ['NV005', 'An', 'Kế toán', 14000000],
];

const lookupResultModes = [
  {
    value: 'first' as const,
    label: 'Lấy kết quả đầu tiên',
  },
  {
    value: 'all' as const,
    label: 'Gộp tất cả kết quả khớp',
  },
];

const recipes: RecipeDefinition[] = [
  {
    id: 'employee_lookup',
    title: 'Tra cứu mã nhân sự',
    description: 'Tìm theo cột đầu và trả về cột kế bên, phù hợp file danh sách nhân sự.',
  },
  {
    id: 'duplicate_person_department',
    title: 'Tìm trùng theo tên + phòng ban',
    description: 'Phát hiện dữ liệu trùng khi một người xuất hiện lặp trong cùng bộ phận.',
  },
  {
    id: 'normalize_department',
    title: 'Chuẩn hóa phòng ban',
    description: 'Dùng replace hàng loạt để đồng bộ cách viết tên phòng ban.',
  },
];

const savedRecipesStorageKey = 'cy-work-helper-recipes';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const getColumnLetter = (index: number) => {
  let result = '';
  let current = index + 1;

  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = `${alphabet[remainder]}${result}`;
    current = Math.floor((current - 1) / 26);
  }

  return result;
};

const stringifyCell = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
};

const normalizeValue = (value: string) => value.trim().toLowerCase();

const parseDelimitedValues = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseNumbers = (value: string) =>
  parseDelimitedValues(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

const compareValues = (left: number, operator: string, right: number) => {
  if (operator === '>') return left > right;
  if (operator === '>=') return left >= right;
  if (operator === '<') return left < right;
  if (operator === '<=') return left <= right;
  if (operator === '=') return left === right;
  return left !== right;
};

const autoFitColumns = (sheet: XLSX.WorkSheet, headers: string[]) => {
  sheet['!cols'] = headers.map((header) => ({
    wch: Math.max(14, Math.min(36, header.length + 4)),
  }));
};

const buildWorkbookFromJson = (
  rows: Record<string, string | number | boolean>[],
  sheetName: string,
  highlightedRowIndexes: number[] = [],
) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const headers = rows.length ? Object.keys(rows[0]) : [];

  autoFitColumns(worksheet, headers);

  highlightedRowIndexes.forEach((rowIndex) => {
    headers.forEach((_, columnIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: columnIndex });
      const cell = worksheet[cellRef];
      if (!cell) return;

      (cell as XLSX.CellObject & { s?: Record<string, unknown> }).s = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: 'FEE2E2' },
        },
        font: {
          color: { rgb: '991B1B' },
          bold: true,
        },
      };
    });
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
};

const readWorkbook = async (file: File): Promise<ParsedWorkbook> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
  });

  const sheets = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const matrix = (XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    }) as unknown[][]).map((row) => row.map(stringifyCell));

    const [rawHeaders = []] = matrix;
    const headers = rawHeaders.map((header, index) => header || `Cột ${getColumnLetter(index)}`);
    const rowLength = Math.max(headers.length, ...matrix.map((row) => row.length));
    const normalizedHeaders =
      headers.length === rowLength
        ? headers
        : Array.from({ length: rowLength }, (_, index) => headers[index] || `Cột ${getColumnLetter(index)}`);

    const rows = matrix.slice(1).map((row, rowIndex) => ({
      rowNumber: rowIndex + 2,
      values: normalizedHeaders.map((_, columnIndex) => row[columnIndex] ?? ''),
    }));

    return {
      name: sheetName,
      headers: normalizedHeaders,
      rows,
    };
  });

  return {
    fileName: file.name,
    sheets,
  };
};

const matchesLookup = (cellValue: string, query: string, mode: LookupMode) => {
  const normalizedCell = normalizeValue(cellValue);
  const normalizedQuery = normalizeValue(query);

  if (!normalizedQuery) return false;
  if (mode === 'contains') return normalizedCell.includes(normalizedQuery);
  if (mode === 'startsWith') return normalizedCell.startsWith(normalizedQuery);
  return normalizedCell === normalizedQuery;
};

const applyMatchMode = (cellValue: string, query: string, mode: MatchMode) =>
  matchesLookup(cellValue, query, mode);

const replaceTextByMode = (source: string, findValue: string, replaceValue: string, mode: MatchMode) => {
  if (!findValue) return source;

  if (mode === 'exact') {
    return normalizeValue(source) === normalizeValue(findValue) ? replaceValue : source;
  }

  if (mode === 'startsWith') {
    return source.toLowerCase().startsWith(findValue.toLowerCase())
      ? `${replaceValue}${source.slice(findValue.length)}`
      : source;
  }

  const pattern = findValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.replace(new RegExp(pattern, 'gi'), replaceValue);
};

export default function CyWorkHelper() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [compareWorkbook, setCompareWorkbook] = useState<ParsedWorkbook | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState('');
  const [compareSelectedSheetName, setCompareSelectedSheetName] = useState('');
  const [lookupColumnIndex, setLookupColumnIndex] = useState(0);
  const [returnColumnIndex, setReturnColumnIndex] = useState(1);
  const [lookupQueries, setLookupQueries] = useState('');
  const [lookupMode, setLookupMode] = useState<LookupMode>('exact');
  const [lookupResultMode, setLookupResultMode] = useState<LookupResultMode>('first');
  const [duplicateSelectedColumns, setDuplicateSelectedColumns] = useState<number[]>([0]);
  const [filters, setFilters] = useState<FilterRule[]>([{ columnIndex: 0, mode: 'contains', value: '' }]);
  const [replaceColumnIndex, setReplaceColumnIndex] = useState(0);
  const [replaceFindValue, setReplaceFindValue] = useState('');
  const [replaceWithValue, setReplaceWithValue] = useState('');
  const [replaceMode, setReplaceMode] = useState<MatchMode>('contains');
  const [compareKeyColumnIndex, setCompareKeyColumnIndex] = useState(0);
  const [compareValueColumnIndex, setCompareValueColumnIndex] = useState(1);
  const [compareOtherKeyColumnIndex, setCompareOtherKeyColumnIndex] = useState(0);
  const [compareOtherValueColumnIndex, setCompareOtherValueColumnIndex] = useState(1);
  const [formulaSearch, setFormulaSearch] = useState('');
  const [selectedFormulaId, setSelectedFormulaId] = useState('sum');
  const [playgroundState, setPlaygroundState] = useState<PlaygroundState>(defaultPlaygroundState);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isReadingCompareFile, setIsReadingCompareFile] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedRecipeName, setSavedRecipeName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedSheet = useMemo(
    () => workbook?.sheets.find((sheet) => sheet.name === selectedSheetName) ?? null,
    [selectedSheetName, workbook],
  );

  const compareSheet = useMemo(
    () => compareWorkbook?.sheets.find((sheet) => sheet.name === compareSelectedSheetName) ?? null,
    [compareSelectedSheetName, compareWorkbook],
  );

  useEffect(() => {
    if (!workbook?.sheets.length) return;

    const firstSheet = workbook.sheets[0];
    setSelectedSheetName(firstSheet.name);
    setLookupColumnIndex(0);
    setReturnColumnIndex(firstSheet.headers.length > 1 ? 1 : 0);
    setDuplicateSelectedColumns([0]);
  }, [workbook]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(savedRecipesStorageKey);
      if (!raw) return;
      setSavedRecipes(JSON.parse(raw) as SavedRecipe[]);
    } catch {
      setSavedRecipes([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(savedRecipesStorageKey, JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    if (!selectedSheet) return;
    setLookupColumnIndex((current) => Math.min(current, Math.max(selectedSheet.headers.length - 1, 0)));
    setReturnColumnIndex((current) => Math.min(current, Math.max(selectedSheet.headers.length - 1, 0)));
    setReplaceColumnIndex((current) => Math.min(current, Math.max(selectedSheet.headers.length - 1, 0)));
    setDuplicateSelectedColumns((current) => {
      const next = current
        .map((index) => Math.min(index, Math.max(selectedSheet.headers.length - 1, 0)))
        .filter((value, index, array) => array.indexOf(value) === index);

      return next.length ? next : [0];
    });
  }, [selectedSheet]);

  useEffect(() => {
    if (!compareWorkbook?.sheets.length) return;

    const firstSheet = compareWorkbook.sheets[0];
    setCompareSelectedSheetName(firstSheet.name);
    setCompareOtherKeyColumnIndex(0);
    setCompareOtherValueColumnIndex(firstSheet.headers.length > 1 ? 1 : 0);
  }, [compareWorkbook]);

  useEffect(() => {
    if (!compareSheet) return;
    setCompareOtherKeyColumnIndex((current) => Math.min(current, Math.max(compareSheet.headers.length - 1, 0)));
    setCompareOtherValueColumnIndex((current) => Math.min(current, Math.max(compareSheet.headers.length - 1, 0)));
  }, [compareSheet]);

  const filteredRows = useMemo(() => {
    if (!selectedSheet) return [];

    const activeFilters = filters.filter((rule) => rule.value.trim());
    if (!activeFilters.length) return selectedSheet.rows;

    return selectedSheet.rows.filter((row) =>
      activeFilters.every((rule) =>
        applyMatchMode(row.values[rule.columnIndex] ?? '', rule.value, rule.mode),
      ),
    );
  }, [filters, selectedSheet]);

  const handleUploadWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsReadingFile(true);
    setError(null);

    try {
      const nextWorkbook = await readWorkbook(file);
      setWorkbook(nextWorkbook);
    } catch (uploadError) {
      setWorkbook(null);
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể đọc file Excel này.');
    } finally {
      setIsReadingFile(false);
      event.target.value = '';
    }
  };

  const handleUploadCompareWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsReadingCompareFile(true);
    setError(null);

    try {
      const nextWorkbook = await readWorkbook(file);
      setCompareWorkbook(nextWorkbook);
    } catch (uploadError) {
      setCompareWorkbook(null);
      setError(uploadError instanceof Error ? uploadError.message : 'Không thể đọc file đối soát này.');
    } finally {
      setIsReadingCompareFile(false);
      event.target.value = '';
    }
  };

  const lookupResults = useMemo<LookupResult[]>(() => {
    if (!selectedSheet) return [];

    return lookupQueries
      .split('\n')
      .map((query) => query.trim())
      .filter(Boolean)
      .map((query) => {
        const matchedRows = filteredRows.filter((row) =>
          matchesLookup(row.values[lookupColumnIndex] ?? '', query, lookupMode),
        );
        const matchedRow = matchedRows[0];
        const allMatchedValues = matchedRows
          .map((row) => row.values[returnColumnIndex] ?? '')
          .filter(Boolean);

        return {
          query,
          matchValue:
            lookupResultMode === 'all'
              ? allMatchedValues.join(' | ')
              : matchedRow?.values[returnColumnIndex] ?? '',
          rowNumber: matchedRow?.rowNumber ?? null,
          found: Boolean(matchedRow),
          matchedBy: matchedRow?.values[lookupColumnIndex] ?? '',
          matchCount: matchedRows.length,
          allMatchesPreview: matchedRows
            .slice(0, 5)
            .map((row) => `#${row.rowNumber}: ${row.values[returnColumnIndex] ?? ''}`)
            .join(' | '),
        };
      });
  }, [filteredRows, lookupColumnIndex, lookupMode, lookupQueries, lookupResultMode, returnColumnIndex, selectedSheet]);

  const duplicateResults = useMemo<DuplicateRowResult[]>(() => {
    if (!selectedSheet) return [];

    const counts = new Map<string, number>();
    filteredRows.forEach((row) => {
      const value = duplicateSelectedColumns
        .map((index) => row.values[index] ?? '')
        .map((item) => normalizeValue(item))
        .join('||');
      if (!value) return;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });

    return filteredRows.map((row) => {
      const sourceValues = duplicateSelectedColumns.map((index) => row.values[index] ?? '');
      const value = sourceValues.join(' | ');
      const normalizedText = sourceValues.map((item) => normalizeValue(item)).join('||');
      const duplicateCount = normalizedText ? counts.get(normalizedText) ?? 0 : 0;

      return {
        rowNumber: row.rowNumber,
        value,
        duplicateCount,
        duplicate: duplicateCount > 1,
        row,
      };
    });
  }, [duplicateSelectedColumns, filteredRows, selectedSheet]);

  const duplicateRowsOnly = useMemo(
    () => duplicateResults.filter((item) => item.duplicate),
    [duplicateResults],
  );

  const replacePreview = useMemo<ReplacePreviewRow[]>(() => {
    if (!selectedSheet) return [];

    return filteredRows.map((row) => {
      const before = row.values[replaceColumnIndex] ?? '';
      const after = replaceTextByMode(before, replaceFindValue, replaceWithValue, replaceMode);

      return {
        rowNumber: row.rowNumber,
        before,
        after,
        changed: before !== after,
      };
    });
  }, [filteredRows, replaceColumnIndex, replaceFindValue, replaceMode, replaceWithValue, selectedSheet]);

  const changedReplaceRows = useMemo(
    () => replacePreview.filter((item) => item.changed),
    [replacePreview],
  );

  const compareResults = useMemo<CompareResult[]>(() => {
    if (!selectedSheet || !compareSheet) return [];

    const primaryMap = new Map<string, string>();
    const secondaryMap = new Map<string, string>();

    filteredRows.forEach((row) => {
      const key = row.values[compareKeyColumnIndex] ?? '';
      if (key) primaryMap.set(normalizeValue(key), row.values[compareValueColumnIndex] ?? '');
    });

    compareSheet.rows.forEach((row) => {
      const key = row.values[compareOtherKeyColumnIndex] ?? '';
      if (key) secondaryMap.set(normalizeValue(key), row.values[compareOtherValueColumnIndex] ?? '');
    });

    const keys = new Set([...primaryMap.keys(), ...secondaryMap.keys()]);

    return Array.from(keys).map((key) => {
      const primaryValue = primaryMap.get(key) ?? '';
      const secondaryValue = secondaryMap.get(key) ?? '';

      let status: CompareResult['status'] = 'match';
      if (!primaryMap.has(key)) status = 'missing_in_primary';
      else if (!secondaryMap.has(key)) status = 'missing_in_secondary';
      else if (primaryValue !== secondaryValue) status = 'mismatch';

      return {
        key,
        primaryValue,
        secondaryValue,
        status,
      };
    });
  }, [
    compareKeyColumnIndex,
    compareOtherKeyColumnIndex,
    compareOtherValueColumnIndex,
    compareSheet,
    compareValueColumnIndex,
    filteredRows,
    selectedSheet,
  ]);

  const filteredFormulas = useMemo(() => {
    const search = normalizeValue(formulaSearch);
    if (!search) return formulaGuides;

    return formulaGuides.filter((guide) =>
      [guide.name, guide.description, guide.example, guide.category].some((field) =>
        normalizeValue(field).includes(search),
      ),
    );
  }, [formulaSearch]);

  const selectedFormula = useMemo(
    () => formulaGuides.find((guide) => guide.id === selectedFormulaId) ?? formulaGuides[0],
    [selectedFormulaId],
  );

  const playgroundPreview = useMemo(() => {
    if (selectedFormulaId === 'sum') {
      const numbers = parseNumbers(playgroundState.numbers);
      const total = numbers.reduce((sum, value) => sum + value, 0);

      return {
        formula: `=SUM(${numbers.join(', ')})`,
        result: numbers.length ? total.toLocaleString('vi-VN') : 'Chưa có số hợp lệ',
      };
    }

    if (selectedFormulaId === 'countif') {
      const values = parseDelimitedValues(playgroundState.countifValues);
      const criteria = normalizeValue(playgroundState.countifCriteria);
      const count = values.filter((value) => normalizeValue(value) === criteria).length;

      return {
        formula: `=COUNTIF(vùng, "${playgroundState.countifCriteria}")`,
        result: `${count} kết quả khớp`,
      };
    }

    if (selectedFormulaId === 'sumif') {
      const criteriaRange = parseDelimitedValues(playgroundState.sumifCriteriaRange);
      const sumValues = parseNumbers(playgroundState.sumifValues);
      const criteria = normalizeValue(playgroundState.sumifCriteria);
      const total = criteriaRange.reduce((sum, value, index) => {
        if (normalizeValue(value) === criteria) {
          return sum + (sumValues[index] ?? 0);
        }

        return sum;
      }, 0);

      return {
        formula: `=SUMIF(criteria_range, "${playgroundState.sumifCriteria}", sum_range)`,
        result: total.toLocaleString('vi-VN'),
      };
    }

    if (selectedFormulaId === 'if') {
      const left = Number(playgroundState.ifValue);
      const right = Number(playgroundState.ifCompareTo);
      const passed = Number.isFinite(left) && Number.isFinite(right)
        ? compareValues(left, playgroundState.ifOperator, right)
        : false;

      return {
        formula: `=IF(${playgroundState.ifValue}${playgroundState.ifOperator}${playgroundState.ifCompareTo},"${playgroundState.ifTrueValue}","${playgroundState.ifFalseValue}")`,
        result: passed ? playgroundState.ifTrueValue : playgroundState.ifFalseValue,
      };
    }

    if (selectedFormulaId === 'concat') {
      return {
        formula: `=CONCAT("${playgroundState.concatFirst}","${playgroundState.concatDelimiter}","${playgroundState.concatSecond}")`,
        result: `${playgroundState.concatFirst}${playgroundState.concatDelimiter}${playgroundState.concatSecond}`,
      };
    }

    return {
      formula: selectedFormula.example,
      result: 'Dùng khu VLOOKUP phía trên để thử trực tiếp với file Excel thực tế.',
    };
  }, [playgroundState, selectedFormula.example, selectedFormulaId]);

  const handleExportLookupResults = () => {
    if (!lookupResults.length) return;

    const rows = lookupResults.map((item) => ({
      'Giá trị tra cứu': item.query,
      'Giá trị khớp trong file': item.matchedBy || '',
      'Kết quả trả về': item.matchValue || 'Không tìm thấy',
      'Số kết quả khớp': item.matchCount,
      'Tóm tắt nhiều kết quả': item.allMatchesPreview,
      'Trạng thái': item.found ? 'Khớp' : 'Không khớp',
      'Dòng trong file': item.rowNumber ?? '',
    }));

    const workbookToExport = buildWorkbookFromJson(
      rows,
      'VLOOKUP',
      lookupResults.map((item, index) => (item.found ? -1 : index)).filter((index) => index >= 0),
    );

    XLSX.writeFile(workbookToExport, 'cy-vlookup-ket-qua.xlsx');
  };

  const handleExportLookupMisses = () => {
    const misses = lookupResults.filter((item) => !item.found);
    if (!misses.length) return;

    const workbookToExport = buildWorkbookFromJson(
      misses.map((item) => ({
        'Giá trị tra cứu': item.query,
        'Trạng thái': 'Không khớp',
      })),
      'Lookup Misses',
      misses.map((_, index) => index),
    );

    XLSX.writeFile(workbookToExport, 'cy-tra-cuu-khong-khop.xlsx');
  };

  const handleDownloadDemoWorkbook = () => {
    const workbookToExport = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(demoWorkbookRows);
    autoFitColumns(worksheet, demoWorkbookRows[0].map((value) => String(value)));
    XLSX.utils.book_append_sheet(workbookToExport, worksheet, 'NhanSu');
    XLSX.writeFile(workbookToExport, 'cy-mau-du-lieu-excel.xlsx');
  };

  const toggleDuplicateColumn = (index: number) => {
    setDuplicateSelectedColumns((current) => {
      if (current.includes(index)) {
        const next = current.filter((value) => value !== index);
        return next.length ? next : [index];
      }

        return [...current, index].sort((left, right) => left - right);
    });
  };

  const updateFilter = (index: number, nextRule: Partial<FilterRule>) => {
    setFilters((current) =>
      current.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...nextRule } : rule)),
    );
  };

  const addFilter = () => {
    setFilters((current) => [...current, { columnIndex: 0, mode: 'contains', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters((current) =>
      current.length === 1
        ? [{ columnIndex: 0, mode: 'contains', value: '' }]
        : current.filter((_, ruleIndex) => ruleIndex !== index),
    );
  };

  const applyRecipe = (recipeId: string) => {
    if (!selectedSheet) return;

    if (recipeId === 'employee_lookup') {
      setLookupColumnIndex(0);
      setReturnColumnIndex(Math.min(1, selectedSheet.headers.length - 1));
      setLookupMode('exact');
      setLookupResultMode('first');
      setLookupQueries('NV001\nNV003\nNV999');
      return;
    }

    if (recipeId === 'duplicate_person_department') {
      setDuplicateSelectedColumns([1, 2].filter((index) => index < selectedSheet.headers.length));
      return;
    }

    if (recipeId === 'normalize_department') {
      const departmentIndex = Math.min(2, selectedSheet.headers.length - 1);
      setReplaceColumnIndex(departmentIndex);
      setReplaceMode('contains');
      setReplaceFindValue('Vận hành');
      setReplaceWithValue('Van hanh');
    }
  };

  const handleExportDuplicateResults = () => {
    if (!selectedSheet || !duplicateResults.length) return;

    const rows = duplicateResults.map((item) =>
      selectedSheet.headers.reduce<Record<string, string | number | boolean>>(
        (accumulator, header, index) => {
          accumulator[header] = item.row.values[index] ?? '';
          return accumulator;
        },
        {
          'Dòng gốc': item.rowNumber,
          'Giá trị kiểm tra': item.value,
          'Số lần lặp': item.duplicateCount,
          'Bị lặp': item.duplicate,
        },
      ),
    );

    const workbookToExport = buildWorkbookFromJson(
      rows,
      'Duplicate Check',
      duplicateResults.map((item, index) => (item.duplicate ? index : -1)).filter((index) => index >= 0),
    );

    XLSX.writeFile(workbookToExport, 'cy-gia-tri-lap.xlsx');
  };

  const handleExportDuplicateRowsOnly = () => {
    if (!selectedSheet || !duplicateRowsOnly.length) return;

    const rows = duplicateRowsOnly.map((item) =>
      selectedSheet.headers.reduce<Record<string, string | number | boolean>>(
        (accumulator, header, index) => {
          accumulator[header] = item.row.values[index] ?? '';
          return accumulator;
        },
        {
          'Dòng gốc': item.rowNumber,
          'Khóa trùng': item.value,
          'Số lần lặp': item.duplicateCount,
        },
      ),
    );

    const workbookToExport = buildWorkbookFromJson(rows, 'Duplicate Rows', rows.map((_, index) => index));
    XLSX.writeFile(workbookToExport, 'cy-chi-dong-trung.xlsx');
  };

  const handleExportReplaceResults = () => {
    if (!replacePreview.length) return;

    const workbookToExport = buildWorkbookFromJson(
      replacePreview.map((item) => ({
        'Dòng gốc': item.rowNumber,
        'Giá trị trước': item.before,
        'Giá trị sau': item.after,
        'Đã đổi': item.changed,
      })),
      'Replace Preview',
      replacePreview.map((item, index) => (item.changed ? index : -1)).filter((index) => index >= 0),
    );

    XLSX.writeFile(workbookToExport, 'cy-replace-preview.xlsx');
  };

  const handleExportAppliedReplaceWorkbook = () => {
    if (!selectedSheet) return;

    const headers = selectedSheet.headers;
    const rows = filteredRows.map((row) =>
      headers.reduce<Record<string, string>>((accumulator, header, index) => {
        const rawValue = row.values[index] ?? '';
        accumulator[header] =
          index === replaceColumnIndex
            ? replaceTextByMode(rawValue, replaceFindValue, replaceWithValue, replaceMode)
            : rawValue;
        return accumulator;
      }, {}),
    );

    const workbookToExport = buildWorkbookFromJson(rows, 'Applied Replace');
    XLSX.writeFile(workbookToExport, 'cy-replace-da-ap-dung.xlsx');
  };

  const handleSaveCurrentRecipe = () => {
    const name = savedRecipeName.trim();
    if (!name) return;

    const recipe: SavedRecipe = {
      id: `${Date.now()}`,
      name,
      lookupColumnIndex,
      returnColumnIndex,
      lookupMode,
      lookupResultMode,
      duplicateSelectedColumns,
      filters,
      replaceColumnIndex,
      replaceMode,
      replaceFindValue,
      replaceWithValue,
    };

    setSavedRecipes((current) => [recipe, ...current]);
    setSavedRecipeName('');
  };

  const applySavedRecipe = (recipe: SavedRecipe) => {
    setLookupColumnIndex(recipe.lookupColumnIndex);
    setReturnColumnIndex(recipe.returnColumnIndex);
    setLookupMode(recipe.lookupMode);
    setLookupResultMode(recipe.lookupResultMode);
    setDuplicateSelectedColumns(recipe.duplicateSelectedColumns);
    setFilters(recipe.filters);
    setReplaceColumnIndex(recipe.replaceColumnIndex);
    setReplaceMode(recipe.replaceMode);
    setReplaceFindValue(recipe.replaceFindValue);
    setReplaceWithValue(recipe.replaceWithValue);
  };

  const removeSavedRecipe = (id: string) => {
    setSavedRecipes((current) => current.filter((recipe) => recipe.id !== id));
  };

  const handleExportCompareResults = () => {
    if (!compareResults.length) return;

    const workbookToExport = buildWorkbookFromJson(
      compareResults.map((item) => ({
        'Khóa đối soát': item.key,
        'Giá trị file chính': item.primaryValue,
        'Giá trị file phụ': item.secondaryValue,
        'Trạng thái': item.status,
      })),
      'Compare Results',
      compareResults
        .map((item, index) => (item.status === 'match' ? -1 : index))
        .filter((index) => index >= 0),
    );

    XLSX.writeFile(workbookToExport, 'cy-bao-cao-doi-soat.xlsx');
  };

  const renderPlaygroundFields = () => {
    if (selectedFormulaId === 'sum') {
      return (
        <textarea
          value={playgroundState.numbers}
          onChange={(event) =>
            setPlaygroundState((current) => ({ ...current, numbers: event.target.value }))
          }
          rows={4}
          placeholder="Nhập số, ngăn cách bằng dấu phẩy hoặc xuống dòng"
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
        />
      );
    }

    if (selectedFormulaId === 'countif') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <textarea
            value={playgroundState.countifValues}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, countifValues: event.target.value }))
            }
            rows={4}
            placeholder="Danh sách cần đếm"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
          <input
            value={playgroundState.countifCriteria}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, countifCriteria: event.target.value }))
            }
            placeholder="Điều kiện, ví dụ: Nam"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
        </div>
      );
    }

    if (selectedFormulaId === 'sumif') {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          <textarea
            value={playgroundState.sumifCriteriaRange}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, sumifCriteriaRange: event.target.value }))
            }
            rows={4}
            placeholder="Cột điều kiện"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
          <textarea
            value={playgroundState.sumifValues}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, sumifValues: event.target.value }))
            }
            rows={4}
            placeholder="Cột số cần cộng"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
          <input
            value={playgroundState.sumifCriteria}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, sumifCriteria: event.target.value }))
            }
            placeholder="Điều kiện, ví dụ: Nam"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
        </div>
      );
    }

    if (selectedFormulaId === 'if') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={playgroundState.ifValue}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, ifValue: event.target.value }))
            }
            placeholder="Giá trị cần so sánh"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
          <input
            value={playgroundState.ifCompareTo}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, ifCompareTo: event.target.value }))
            }
            placeholder="Giá trị mốc"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
          <select
            value={playgroundState.ifOperator}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, ifOperator: event.target.value }))
            }
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-cyan-300 focus:outline-none"
          >
            <option value=">=">&gt;=</option>
            <option value=">">&gt;</option>
            <option value="<=">&lt;=</option>
            <option value="<">&lt;</option>
            <option value="=">=</option>
            <option value="<>">&lt;&gt;</option>
          </select>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={playgroundState.ifTrueValue}
              onChange={(event) =>
                setPlaygroundState((current) => ({ ...current, ifTrueValue: event.target.value }))
              }
              placeholder="Khi đúng"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
            />
            <input
              value={playgroundState.ifFalseValue}
              onChange={(event) =>
                setPlaygroundState((current) => ({ ...current, ifFalseValue: event.target.value }))
              }
              placeholder="Khi sai"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
            />
          </div>
        </div>
      );
    }

    if (selectedFormulaId === 'concat') {
      return (
        <div className="grid gap-4 md:grid-cols-3">
          <input
            value={playgroundState.concatFirst}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, concatFirst: event.target.value }))
            }
            placeholder="Đoạn 1"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
          <input
            value={playgroundState.concatDelimiter}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, concatDelimiter: event.target.value }))
            }
            placeholder="Ngăn cách"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
          <input
            value={playgroundState.concatSecond}
            onChange={(event) =>
              setPlaygroundState((current) => ({ ...current, concatSecond: event.target.value }))
            }
            placeholder="Đoạn 2"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-4 text-sm text-white/65">
        Hàm này đã có khu thao tác thật ở phần tra cứu file Excel phía trên, nên mình giữ playground gọn để tránh trùng chức năng.
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Giúp Cy làm việc</h1>
          <p className="max-w-3xl text-base text-white/60 sm:text-lg">
            Một module riêng để xử lý Excel nhanh: tra cứu kiểu VLOOKUP, tìm giá trị lặp có tô đỏ, và tra cứu công thức phổ biến với khu thử trực tiếp.
          </p>
        </motion.div>

        <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md sm:self-auto">
          <Sparkles className="h-5 w-5 text-orange-300" />
          <span className="text-sm font-medium text-white/90">Tối ưu cho cả desktop lẫn mobile</span>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-orange-400/15 p-3">
              <Sparkles className="h-6 w-6 text-orange-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Recipe 1 chạm</h2>
              <p className="text-sm text-white/60">Bấm một cái để nạp sẵn cấu hình hay dùng cho Cy.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => applyRecipe(recipe.id)}
                disabled={!selectedSheet}
                className="rounded-3xl border border-white/10 bg-black/10 p-4 text-left transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <p className="font-semibold text-white">{recipe.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{recipe.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/10 p-4">
            <p className="text-sm font-semibold text-white">Lưu recipe riêng cho Cy</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={savedRecipeName}
                onChange={(event) => setSavedRecipeName(event.target.value)}
                placeholder="Tên recipe, ví dụ: check file lương"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={handleSaveCurrentRecipe}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
              >
                Lưu recipe
              </button>
            </div>

            {savedRecipes.length ? (
              <div className="mt-4 grid gap-3">
                {savedRecipes.slice(0, 6).map((recipe) => (
                  <div key={recipe.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-white">{recipe.name}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => applySavedRecipe(recipe)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                      >
                        Áp dụng
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedRecipe(recipe.id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </TiltCard>

        <TiltCard className="bg-white/5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-sky-400/15 p-3">
              <Filter className="h-6 w-6 text-sky-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Lọc trước khi xử lý</h2>
              <p className="text-sm text-white/60">Giới hạn đúng vùng dữ liệu cần xử lý trước khi tra cứu, tìm trùng hay replace.</p>
            </div>
          </div>

          <div className="space-y-4">
            {filters.map((rule, index) => (
              <div key={`filter-${index}`} className="grid gap-3 rounded-3xl border border-white/10 bg-black/10 p-4 md:grid-cols-[1fr_180px_minmax(0,1fr)_auto]">
                <select
                  value={rule.columnIndex}
                  onChange={(event) => updateFilter(index, { columnIndex: Number(event.target.value) })}
                  disabled={!selectedSheet}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                >
                  {selectedSheet?.headers.map((header, columnIndex) => (
                    <option key={`${header}-${columnIndex}`} value={columnIndex}>
                      {getColumnLetter(columnIndex)} - {header}
                    </option>
                  )) ?? <option>Chưa có cột</option>}
                </select>
                <select
                  value={rule.mode}
                  onChange={(event) => updateFilter(index, { mode: event.target.value as MatchMode })}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
                >
                  {matchModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={rule.value}
                  onChange={(event) => updateFilter(index, { value: event.target.value })}
                  placeholder="Giá trị lọc"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => removeFilter(index)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10"
                >
                  Xóa
                </button>
              </div>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/55">
                {filteredRows.length}/{selectedSheet?.rows.length ?? 0} dòng đang nằm trong vùng xử lý
              </p>
              <button
                type="button"
                onClick={addFilter}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 sm:w-auto"
              >
                <Filter className="h-4 w-4" />
                Thêm điều kiện lọc
              </button>
            </div>
          </div>
        </TiltCard>
      </div>

      <TiltCard className="bg-gradient-to-br from-cyan-500/10 via-white/5 to-orange-500/10">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-400/15 p-3">
                <FileSpreadsheet className="h-6 w-6 text-cyan-200" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Nạp file Excel</h2>
                <p className="text-sm text-white/60">Hỗ trợ `.xlsx` và `.xls`, đọc trực tiếp trên trình duyệt.</p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/10 px-6 py-10 text-center transition-colors hover:bg-black/15">
              <Upload className="h-8 w-8 text-cyan-200" />
              <p className="mt-4 text-lg font-semibold text-white">
                {isReadingFile ? 'Đang đọc file Excel...' : 'Chạm để chọn file Excel'}
              </p>
              <p className="mt-2 text-sm text-white/55">Sau khi nạp, bạn có thể đổi sheet và thao tác ngay bên dưới.</p>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUploadWorkbook} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleDownloadDemoWorkbook}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 sm:w-auto"
            >
              <FileUp className="h-4 w-4" />
              Tải file mẫu để thử ngay
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-white/40">Tệp hiện tại</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {workbook?.fileName ?? 'Chưa có file nào được nạp'}
              </p>
              <p className="mt-2 text-sm text-white/55">
                {workbook
                  ? `${workbook.sheets.length} sheet sẵn sàng cho tra cứu và kiểm tra trùng lặp`
                  : 'Tải lên file trước để mở khóa các công cụ xử lý dữ liệu.'}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
              <label className="mb-2 block text-sm text-white/60">Chọn sheet để thao tác</label>
              <select
                value={selectedSheetName}
                onChange={(event) => setSelectedSheetName(event.target.value)}
                disabled={!workbook}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {workbook?.sheets.map((sheet) => (
                  <option key={sheet.name} value={sheet.name}>
                    {sheet.name}
                  </option>
                )) ?? <option>Chưa có sheet</option>}
              </select>
              {selectedSheet ? (
                <p className="mt-3 text-sm text-white/55">
                  {selectedSheet.headers.length} cột, {selectedSheet.rows.length} dòng dữ liệu
                </p>
              ) : null}
            </div>

            {selectedSheet ? (
              <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">Xem nhanh dữ liệu</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <div className="max-h-56 overflow-auto">
                    <table className="min-w-full text-left text-xs text-white/75">
                      <thead className="sticky top-0 bg-slate-950/95">
                        <tr>
                          {selectedSheet.headers.slice(0, 4).map((header, index) => (
                            <th key={`${header}-${index}`} className="px-3 py-2">
                              {getColumnLetter(index)} - {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSheet.rows.slice(0, 5).map((row) => (
                          <tr key={row.rowNumber} className="border-t border-white/10">
                            {row.values.slice(0, 4).map((value, index) => (
                              <td key={`${row.rowNumber}-${index}`} className="px-3 py-2">
                                {value || '(Trống)'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </TiltCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-400/15 p-3">
              <Search className="h-6 w-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tra cứu kiểu VLOOKUP</h2>
              <p className="text-sm text-white/60">Nhập cột tìm, cột trả về, rồi dán danh sách giá trị cần tra cứu.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm text-white/60">Cột dùng để tìm</label>
                <select
                  value={lookupColumnIndex}
                  onChange={(event) => setLookupColumnIndex(Number(event.target.value))}
                  disabled={!selectedSheet}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedSheet?.headers.map((header, index) => (
                    <option key={`${header}-${index}`} value={index}>
                      {getColumnLetter(index)} - {header}
                    </option>
                  )) ?? <option>Chưa có cột</option>}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">Kiểu tra cứu</label>
                <select
                  value={lookupMode}
                  onChange={(event) => setLookupMode(event.target.value as LookupMode)}
                  disabled={!selectedSheet}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {lookupModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-white/45">
                  {lookupModes.find((mode) => mode.value === lookupMode)?.description}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">Kiểu trả kết quả</label>
                <select
                  value={lookupResultMode}
                  onChange={(event) => setLookupResultMode(event.target.value as LookupResultMode)}
                  disabled={!selectedSheet}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {lookupResultModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">Cột trả kết quả</label>
                <select
                  value={returnColumnIndex}
                  onChange={(event) => setReturnColumnIndex(Number(event.target.value))}
                  disabled={!selectedSheet}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedSheet?.headers.map((header, index) => (
                    <option key={`${header}-${index}`} value={index}>
                      {getColumnLetter(index)} - {header}
                    </option>
                  )) ?? <option>Chưa có cột</option>}
                </select>
              </div>
            </div>

            <textarea
              value={lookupQueries}
              onChange={(event) => setLookupQueries(event.target.value)}
              rows={6}
              placeholder="Mỗi dòng là một giá trị cần tra cứu, ví dụ:&#10;NV001&#10;NV002&#10;NV003"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white placeholder:text-white/30 focus:border-emerald-300 focus:outline-none"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/55">
                {lookupResults.length
                  ? `${lookupResults.filter((item) => item.found).length}/${lookupResults.length} giá trị đã khớp`
                  : 'Nạp file và nhập danh sách để xem kết quả online ngay tại đây.'}
              </p>
              <button
                type="button"
                onClick={handleExportLookupResults}
                disabled={!lookupResults.length}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Export kết quả
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportLookupMisses}
              disabled={!lookupResults.some((item) => !item.found)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export riÃªng cÃ¡c giÃ¡ trá»‹ khÃ´ng khá»›p
            </button>

            <button
              type="button"
              onClick={handleExportDuplicateRowsOnly}
              disabled={!duplicateRowsOnly.length}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export riÃªng cÃ¡c dÃ²ng trÃ¹ng
            </button>

            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="max-h-[420px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-950/95 text-white/70">
                    <tr>
                      <th className="px-4 py-3">Giá trị tra cứu</th>
                      <th className="px-4 py-3">Giá trị khớp</th>
                      <th className="px-4 py-3">Kết quả</th>
                      <th className="px-4 py-3">Số khớp</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Dòng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lookupResults.length ? (
                      lookupResults.map((item) => (
                        <tr key={`${item.query}-${item.rowNumber ?? 'na'}`} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white">{item.query}</td>
                          <td className="px-4 py-3 text-white/65">{item.matchedBy || '-'}</td>
                          <td className="px-4 py-3 text-white/80">
                            {item.matchValue || 'Không tìm thấy'}
                            {item.allMatchesPreview && item.matchCount > 1 ? (
                              <p className="mt-1 text-xs text-white/45">{item.allMatchesPreview}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-white/60">{item.matchCount}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.found
                                  ? 'bg-emerald-500/15 text-emerald-200'
                                  : 'bg-rose-500/15 text-rose-200'
                              }`}
                            >
                              {item.found ? 'Khớp' : 'Không khớp'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/60">{item.rowNumber ?? '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-white/45">
                          Kết quả tra cứu sẽ xuất hiện ở đây.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-rose-400/15 p-3">
              <TableProperties className="h-6 w-6 text-rose-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tìm giá trị lặp</h2>
              <p className="text-sm text-white/60">Chọn cột cần rà soát, hệ thống tô đỏ dòng trùng và cho export ngay.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm text-white/60">Cột kiểm tra trùng lặp</label>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                  {selectedSheet?.headers.map((header, index) => {
                    const active = duplicateSelectedColumns.includes(index);

                    return (
                      <button
                        key={`${header}-duplicate-${index}`}
                        type="button"
                        onClick={() => toggleDuplicateColumn(index)}
                        className={`rounded-full px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-rose-500 text-white'
                            : 'border border-white/10 bg-white/5 text-white/65 hover:bg-white/10'
                        }`}
                      >
                        {getColumnLetter(index)} - {header}
                      </button>
                    );
                  }) ?? <span className="text-sm text-white/45">Chưa có cột</span>}
                </div>
                <p className="mt-2 text-xs text-white/45">
                  Có thể chọn nhiều cột để tạo khóa ghép và tìm trùng chính xác hơn.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportDuplicateResults}
                disabled={!duplicateResults.length}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              >
                <Download className="h-4 w-4" />
                Export kết quả
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">Tổng dòng</p>
                <p className="mt-3 text-3xl font-bold text-white">{duplicateResults.length}</p>
              </div>
              <div className="rounded-3xl border border-rose-400/15 bg-rose-500/10 p-4">
                <p className="text-sm uppercase tracking-[0.22em] text-rose-100/55">Dòng bị lặp</p>
                <p className="mt-3 text-3xl font-bold text-rose-200">{duplicateRowsOnly.length}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/15 p-4 text-sm text-white/60">
              Đang kiểm tra theo khóa: {' '}
              <span className="font-semibold text-white">
                {selectedSheet
                  ? duplicateSelectedColumns
                      .map((index) => `${getColumnLetter(index)} - ${selectedSheet.headers[index]}`)
                      .join(' + ')
                  : 'Chưa chọn cột'}
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="max-h-[420px] overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-950/95 text-white/70">
                    <tr>
                      <th className="px-4 py-3">Dòng</th>
                      <th className="px-4 py-3">Giá trị</th>
                      <th className="px-4 py-3">Số lần lặp</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateResults.length ? (
                      duplicateResults.map((item) => (
                        <tr
                          key={`${item.rowNumber}-${item.value}`}
                          className={`border-t border-white/10 ${
                            item.duplicate ? 'bg-red-500/15 text-red-50' : 'text-white/80'
                          }`}
                        >
                          <td className="px-4 py-3">{item.rowNumber}</td>
                          <td className="px-4 py-3">{item.value || '(Trống)'}</td>
                          <td className="px-4 py-3">{item.duplicateCount}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                item.duplicate
                                  ? 'bg-red-500/20 text-red-100'
                                  : 'bg-white/10 text-white/60'
                              }`}
                            >
                              {item.duplicate ? 'Bị lặp' : 'Không lặp'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-white/45">
                          Kết quả kiểm tra trùng lặp sẽ hiện ở đây.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>

      <TiltCard className="bg-white/5">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-violet-400/15 p-3">
            <Replace className="h-6 w-6 text-violet-200" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Replace hàng loạt</h2>
            <p className="text-sm text-white/60">Tìm và thay thế giá trị trên cột đã chọn trong đúng vùng dữ liệu đang được lọc.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_180px_minmax(0,1fr)_minmax(0,1fr)]">
          <select
            value={replaceColumnIndex}
            onChange={(event) => setReplaceColumnIndex(Number(event.target.value))}
            disabled={!selectedSheet}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            {selectedSheet?.headers.map((header, index) => (
              <option key={`${header}-replace-${index}`} value={index}>
                {getColumnLetter(index)} - {header}
              </option>
            )) ?? <option>Chưa có cột</option>}
          </select>
          <select
            value={replaceMode}
            onChange={(event) => setReplaceMode(event.target.value as MatchMode)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            {matchModeOptions.map((option) => (
              <option key={`${option.value}-replace`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={replaceFindValue}
            onChange={(event) => setReplaceFindValue(event.target.value)}
            placeholder="Tìm giá trị"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30"
          />
          <input
            value={replaceWithValue}
            onChange={(event) => setReplaceWithValue(event.target.value)}
            placeholder="Thay bằng"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/55">
            {changedReplaceRows.length}/{replacePreview.length} dòng sẽ được thay đổi nếu export preview.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={handleExportReplaceResults}
              disabled={!replacePreview.length}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white/80 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export preview
            </button>
            <button
              type="button"
              onClick={handleExportAppliedReplaceWorkbook}
              disabled={!replacePreview.length}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export file đã replace
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
          <div className="max-h-80 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-950/95 text-white/70">
                <tr>
                  <th className="px-4 py-3">Dòng</th>
                  <th className="px-4 py-3">Trước</th>
                  <th className="px-4 py-3">Sau</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {replacePreview.length ? (
                  replacePreview.slice(0, 80).map((item) => (
                    <tr key={`replace-${item.rowNumber}`} className="border-t border-white/10">
                      <td className="px-4 py-3 text-white/60">{item.rowNumber}</td>
                      <td className="px-4 py-3 text-white">{item.before || '(Trống)'}</td>
                      <td className="px-4 py-3 text-white">{item.after || '(Trống)'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.changed ? 'bg-violet-500/20 text-violet-100' : 'bg-white/10 text-white/55'}`}>
                          {item.changed ? 'Sẽ đổi' : 'Giữ nguyên'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-white/45">
                      Preview replace sẽ xuất hiện ở đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TiltCard>

      <TiltCard className="bg-white/5">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-lime-400/15 p-3">
            <FileSpreadsheet className="h-6 w-6 text-lime-200" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Đối soát 2 file</h2>
            <p className="text-sm text-white/60">So sánh file chính với file phụ theo khóa và cột giá trị để phát hiện lệch.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/10 px-6 py-8 text-center transition-colors hover:bg-black/15">
              <Upload className="h-8 w-8 text-lime-200" />
              <p className="mt-4 text-lg font-semibold text-white">
                {isReadingCompareFile ? 'Đang đọc file đối soát...' : 'Tải file phụ để đối soát'}
              </p>
              <p className="mt-2 text-sm text-white/55">Dùng file khác để so sánh chéo với file chính.</p>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUploadCompareWorkbook} className="hidden" />
            </label>

            <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
              <p className="text-sm uppercase tracking-[0.22em] text-white/40">File phụ</p>
              <p className="mt-2 text-lg font-semibold text-white">{compareWorkbook?.fileName ?? 'Chưa có file phụ'}</p>
            </div>

            <select
              value={compareSelectedSheetName}
              onChange={(event) => setCompareSelectedSheetName(event.target.value)}
              disabled={!compareWorkbook}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            >
              {compareWorkbook?.sheets.map((sheet) => (
                <option key={`compare-${sheet.name}`} value={sheet.name}>
                  {sheet.name}
                </option>
              )) ?? <option>Chưa có sheet</option>}
            </select>

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={compareKeyColumnIndex}
                onChange={(event) => setCompareKeyColumnIndex(Number(event.target.value))}
                disabled={!selectedSheet}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                {selectedSheet?.headers.map((header, index) => (
                  <option key={`pk-${index}`} value={index}>
                    File chính key: {getColumnLetter(index)} - {header}
                  </option>
                )) ?? <option>Chưa có cột</option>}
              </select>
              <select
                value={compareValueColumnIndex}
                onChange={(event) => setCompareValueColumnIndex(Number(event.target.value))}
                disabled={!selectedSheet}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                {selectedSheet?.headers.map((header, index) => (
                  <option key={`pv-${index}`} value={index}>
                    File chính value: {getColumnLetter(index)} - {header}
                  </option>
                )) ?? <option>Chưa có cột</option>}
              </select>
              <select
                value={compareOtherKeyColumnIndex}
                onChange={(event) => setCompareOtherKeyColumnIndex(Number(event.target.value))}
                disabled={!compareSheet}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                {compareSheet?.headers.map((header, index) => (
                  <option key={`sk-${index}`} value={index}>
                    File phụ key: {getColumnLetter(index)} - {header}
                  </option>
                )) ?? <option>Chưa có cột</option>}
              </select>
              <select
                value={compareOtherValueColumnIndex}
                onChange={(event) => setCompareOtherValueColumnIndex(Number(event.target.value))}
                disabled={!compareSheet}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                {compareSheet?.headers.map((header, index) => (
                  <option key={`sv-${index}`} value={index}>
                    File phụ value: {getColumnLetter(index)} - {header}
                  </option>
                )) ?? <option>Chưa có cột</option>}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportCompareResults}
              disabled={!compareResults.length}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 px-5 py-3 font-semibold text-white shadow-lg shadow-lime-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export báo cáo đối soát
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-black/15 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-white/40">Tổng khóa</p>
                <p className="mt-3 text-2xl font-bold text-white">{compareResults.length}</p>
              </div>
              <div className="rounded-3xl border border-emerald-400/15 bg-emerald-500/10 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-100/55">Khớp</p>
                <p className="mt-3 text-2xl font-bold text-emerald-200">{compareResults.filter((item) => item.status === 'match').length}</p>
              </div>
              <div className="rounded-3xl border border-amber-400/15 bg-amber-500/10 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-amber-100/55">Lệch</p>
                <p className="mt-3 text-2xl font-bold text-amber-200">{compareResults.filter((item) => item.status === 'mismatch').length}</p>
              </div>
              <div className="rounded-3xl border border-rose-400/15 bg-rose-500/10 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-rose-100/55">Thiếu</p>
                <p className="mt-3 text-2xl font-bold text-rose-200">{compareResults.filter((item) => item.status !== 'match' && item.status !== 'mismatch').length}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="max-h-96 overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-950/95 text-white/70">
                    <tr>
                      <th className="px-4 py-3">Khóa</th>
                      <th className="px-4 py-3">File chính</th>
                      <th className="px-4 py-3">File phụ</th>
                      <th className="px-4 py-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareResults.length ? (
                      compareResults.slice(0, 120).map((item) => (
                        <tr key={`compare-${item.key}`} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white">{item.key}</td>
                          <td className="px-4 py-3 text-white/75">{item.primaryValue || '-'}</td>
                          <td className="px-4 py-3 text-white/75">{item.secondaryValue || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === 'match'
                                ? 'bg-emerald-500/15 text-emerald-200'
                                : item.status === 'mismatch'
                                  ? 'bg-amber-500/15 text-amber-200'
                                  : 'bg-rose-500/15 text-rose-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-white/45">
                          Kết quả đối soát sẽ hiện ở đây sau khi nạp file phụ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-400/15 p-3">
              <Sigma className="h-6 w-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tra cứu công thức phổ biến</h2>
              <p className="text-sm text-white/60">Có phần lọc nhanh, ví dụ mẫu, link tra cứu chính thức và khu thao tác thử.</p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              value={formulaSearch}
              onChange={(event) => setFormulaSearch(event.target.value)}
              placeholder="Tìm theo tên hàm hoặc mục đích, ví dụ: đếm, cộng, tra cứu"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-300 focus:outline-none"
            />

            <div className="grid gap-4 md:grid-cols-2">
              {filteredFormulas.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setSelectedFormulaId(guide.id)}
                  className={`rounded-3xl border p-5 text-left transition-all ${
                    selectedFormulaId === guide.id
                      ? 'border-amber-300/40 bg-amber-400/10'
                      : 'border-white/10 bg-black/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-white/35">{guide.category}</p>
                      <h3 className="mt-2 text-xl font-bold text-white">{guide.name}</h3>
                    </div>
                    <Calculator className="h-5 w-5 text-white/35" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/65">{guide.description}</p>
                  <div className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-sm text-cyan-100">
                    {guide.syntax}
                  </div>
                  <p className="mt-3 text-sm text-white/55">{guide.example}</p>
                  <a
                    href={guide.source}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="mt-4 inline-flex text-sm font-medium text-orange-300 hover:text-orange-200"
                  >
                    Xem hướng dẫn gốc
                  </a>
                </button>
              ))}
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-gradient-to-br from-slate-900/80 to-cyan-950/40">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400/15 p-3">
              <Calculator className="h-6 w-6 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Thao tác thử</h2>
              <p className="text-sm text-white/60">Đổi hàm ở bên trái, nhập dữ liệu mẫu và xem công thức chạy ra sao.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/15 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-white/35">{selectedFormula.category}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{selectedFormula.name}</h3>
            <p className="mt-3 text-sm leading-6 text-white/65">{selectedFormula.description}</p>
            <div className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-sm text-cyan-100">
              {selectedFormula.syntax}
            </div>

            <div className="mt-5 space-y-4">
              {renderPlaygroundFields()}

              <div className="rounded-3xl border border-cyan-300/15 bg-cyan-400/10 p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-cyan-100/55">Công thức mô phỏng</p>
                <p className="mt-3 break-words text-sm text-cyan-50">{playgroundPreview.formula}</p>
                <p className="mt-5 text-sm uppercase tracking-[0.18em] text-cyan-100/55">Kết quả</p>
                <p className="mt-3 text-2xl font-bold text-white">{playgroundPreview.result}</p>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>

      <TiltCard className="bg-white/5">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-fuchsia-400/15 p-3">
            <Sparkles className="h-6 w-6 text-fuchsia-200" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">GIF minh họa thao tác</h2>
            <p className="text-sm text-white/60">Các GIF tham khảo giúp Cy hình dung nhanh luồng làm việc với bảng tính.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {demoGifs.map((item) => (
            <div key={item.source} className="overflow-hidden rounded-3xl border border-white/10 bg-black/15">
              <div className="aspect-[4/3] bg-black/30">
                <iframe
                  src={item.embedUrl}
                  title={item.title}
                  className="h-full w-full"
                  allowFullScreen
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{item.description}</p>
                <a
                  href={item.source}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm font-medium text-orange-300 hover:text-orange-200"
                >
                  Mở nguồn GIF
                </a>
              </div>
            </div>
          ))}
        </div>
      </TiltCard>
    </div>
  );
}
