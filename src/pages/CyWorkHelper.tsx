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

type LookupMode = 'exact' | 'contains' | 'startsWith';
type LookupResultMode = 'first' | 'all';

type FilterRule = {
  columnIndex: number;
  mode: LookupMode;
  value: string;
};

type LookupResult = {
  query: string;
  matchedBy: string;
  matchValue: string;
  rowNumber: number | null;
  found: boolean;
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

type ReplacePreviewRow = {
  rowNumber: number;
  before: string;
  after: string;
  changed: boolean;
};

type CompareResult = {
  key: string;
  primaryValue: string;
  secondaryValue: string;
  status: 'match' | 'mismatch' | 'missing_in_secondary' | 'missing_in_primary';
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
    description: 'GIF minh họa thao tác nhập liệu và di chuyển trong Excel.',
    embedUrl: 'https://giphy.com/embed/1ZDxS012XuY0ROBzyj',
    source: 'https://giphy.com/gifs/office-excel-help-1ZDxS012XuY0ROBzyj',
  },
  {
    title: 'Thao tác trực quan trên trang tính',
    description: 'GIF minh họa việc chọn ô, copy dữ liệu và xử lý bảng.',
    embedUrl: 'https://giphy.com/embed/fasjTJwTFW2goeR2uV',
    source: 'https://giphy.com/gifs/MicrosoftCloud-heart-microsoft-msignite-fasjTJwTFW2goeR2uV',
  },
  {
    title: 'Rà soát nhiều sheet và dữ liệu lớn',
    description: 'GIF minh họa cách kiểm tra nhiều vùng dữ liệu nhanh hơn.',
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

const lookupModes: Array<{ value: LookupMode; label: string; description: string }> = [
  { value: 'exact', label: 'Khớp chính xác', description: 'Giống VLOOKUP chuẩn với so khớp tuyệt đối.' },
  { value: 'contains', label: 'Chứa nội dung', description: 'Tìm khi ô dữ liệu có chứa chuỗi bạn nhập.' },
  { value: 'startsWith', label: 'Bắt đầu bằng', description: 'Khớp khi dữ liệu bắt đầu với chuỗi cần tìm.' },
];

const lookupResultModes: Array<{ value: LookupResultMode; label: string }> = [
  { value: 'first', label: 'Lấy kết quả đầu tiên' },
  { value: 'all', label: 'Gộp tất cả kết quả khớp' },
];

const demoWorkbookRows = [
  ['Mã NV', 'Tên', 'Phòng ban', 'Lương'],
  ['NV001', 'Cy', 'Vận hành', 12000000],
  ['NV002', 'Nam', 'Kinh doanh', 18000000],
  ['NV003', 'Linh', 'Vận hành', 12500000],
  ['NV004', 'Cy', 'Hỗ trợ', 11500000],
  ['NV005', 'An', 'Kế toán', 14000000],
];

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
        fill: { patternType: 'solid', fgColor: { rgb: 'FCA5A5' } },
        font: { color: { rgb: '7F1D1D' }, bold: true },
      };
    });
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
};

const readWorkbook = async (file: File): Promise<ParsedWorkbook> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

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

    return { name: sheetName, headers: normalizedHeaders, rows };
  });

  return { fileName: file.name, sheets };
};

const matchesLookup = (cellValue: string, query: string, mode: LookupMode) => {
  const normalizedCell = normalizeValue(cellValue);
  const normalizedQuery = normalizeValue(query);

  if (!normalizedQuery) return false;
  if (mode === 'contains') return normalizedCell.includes(normalizedQuery);
  if (mode === 'startsWith') return normalizedCell.startsWith(normalizedQuery);
  return normalizedCell === normalizedQuery;
};

const replaceTextByMode = (source: string, findValue: string, replaceValue: string, mode: LookupMode) => {
  if (!findValue) return source;
  if (mode === 'exact') return normalizeValue(source) === normalizeValue(findValue) ? replaceValue : source;
  if (mode === 'startsWith') {
    return source.toLowerCase().startsWith(findValue.toLowerCase())
      ? `${replaceValue}${source.slice(findValue.length)}`
      : source;
  }

  const pattern = findValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.replace(new RegExp(pattern, 'gi'), replaceValue);
};

const downloadWorkbook = (workbook: XLSX.WorkBook, fileName: string) => {
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([output], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const sectionClass =
  'rounded-[28px] border border-white/10 bg-slate-950/45 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.28)] backdrop-blur md:p-6';
const cardClass =
  'rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-slate-100 shadow-[0_12px_36px_rgba(15,23,42,0.22)]';
const inputClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-emerald-400/70';
const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99]';
const primaryButtonClass = `${buttonClass} bg-emerald-400 text-slate-950 hover:bg-emerald-300`;
const secondaryButtonClass = `${buttonClass} border border-white/10 bg-white/5 text-white hover:bg-white/10`;

export default function CyWorkHelper() {
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [secondaryWorkbook, setSecondaryWorkbook] = useState<ParsedWorkbook | null>(null);
  const [secondarySheetIndex, setSecondarySheetIndex] = useState(0);
  const [lookupColumnIndex, setLookupColumnIndex] = useState(0);
  const [lookupReturnColumnIndex, setLookupReturnColumnIndex] = useState(1);
  const [lookupMode, setLookupMode] = useState<LookupMode>('exact');
  const [lookupResultMode, setLookupResultMode] = useState<LookupResultMode>('first');
  const [lookupQueries, setLookupQueries] = useState('NV001\nNV004\nNV999');
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [duplicateColumnIndexes, setDuplicateColumnIndexes] = useState<number[]>([0]);
  const [replaceColumnIndex, setReplaceColumnIndex] = useState(0);
  const [replaceMode, setReplaceMode] = useState<LookupMode>('contains');
  const [replaceFindValue, setReplaceFindValue] = useState('Vận hành');
  const [replaceValue, setReplaceValue] = useState('Khối vận hành');
  const [comparePrimaryKeyColumn, setComparePrimaryKeyColumn] = useState(0);
  const [comparePrimaryValueColumn, setComparePrimaryValueColumn] = useState(1);
  const [compareSecondaryKeyColumn, setCompareSecondaryKeyColumn] = useState(0);
  const [compareSecondaryValueColumn, setCompareSecondaryValueColumn] = useState(1);
  const [playground, setPlayground] = useState<PlaygroundState>(defaultPlaygroundState);

  const activeSheet = workbook?.sheets[activeSheetIndex] ?? null;
  const secondarySheet = secondaryWorkbook?.sheets[secondarySheetIndex] ?? null;

  useEffect(() => {
    setActiveSheetIndex(0);
  }, [workbook?.fileName]);

  useEffect(() => {
    setSecondarySheetIndex(0);
  }, [secondaryWorkbook?.fileName]);

  useEffect(() => {
    if (!activeSheet) return;
    setLookupColumnIndex((current) => Math.min(current, Math.max(activeSheet.headers.length - 1, 0)));
    setLookupReturnColumnIndex((current) => Math.min(current, Math.max(activeSheet.headers.length - 1, 0)));
    setReplaceColumnIndex((current) => Math.min(current, Math.max(activeSheet.headers.length - 1, 0)));
    setDuplicateColumnIndexes((current) => (current.length ? current.filter((index) => index < activeSheet.headers.length) : [0]));
    setComparePrimaryKeyColumn((current) => Math.min(current, Math.max(activeSheet.headers.length - 1, 0)));
    setComparePrimaryValueColumn((current) => Math.min(current, Math.max(activeSheet.headers.length - 1, 0)));
    setFilterRules((current) =>
      current
        .filter((rule) => rule.columnIndex < activeSheet.headers.length)
        .map((rule) => ({
          ...rule,
          columnIndex: Math.max(0, rule.columnIndex),
        })),
    );
  }, [activeSheet]);

  useEffect(() => {
    if (!secondarySheet) return;
    setCompareSecondaryKeyColumn((current) => Math.min(current, Math.max(secondarySheet.headers.length - 1, 0)));
    setCompareSecondaryValueColumn((current) => Math.min(current, Math.max(secondarySheet.headers.length - 1, 0)));
  }, [secondarySheet]);

  const filteredRows = useMemo(() => {
    if (!activeSheet) return [];
    if (!filterRules.length) return activeSheet.rows;

    return activeSheet.rows.filter((row) =>
      filterRules.every((rule) => matchesLookup(row.values[rule.columnIndex] ?? '', rule.value, rule.mode)),
    );
  }, [activeSheet, filterRules]);

  const previewRows = useMemo(() => filteredRows.slice(0, 6), [filteredRows]);

  const lookupResults = useMemo<LookupResult[]>(() => {
    if (!activeSheet) return [];

    const queries = parseDelimitedValues(lookupQueries);
    return queries.map((query) => {
      const matches = filteredRows.filter((row) => matchesLookup(row.values[lookupColumnIndex] ?? '', query, lookupMode));
      const firstMatch = matches[0];
      const matchedBy = firstMatch?.values[lookupColumnIndex] ?? '';
      const returnedValues = matches.map((row) => row.values[lookupReturnColumnIndex] ?? '').filter(Boolean);

      return {
        query,
        matchedBy,
        matchValue:
          lookupResultMode === 'all'
            ? returnedValues.join(' | ')
            : firstMatch?.values[lookupReturnColumnIndex] ?? '',
        rowNumber: firstMatch?.rowNumber ?? null,
        found: matches.length > 0,
        matchCount: matches.length,
        allMatchesPreview:
          matches
            .slice(0, 3)
            .map((row) => `Dòng ${row.rowNumber}: ${row.values[lookupReturnColumnIndex] ?? ''}`)
            .join(' | ') || '',
      };
    });
  }, [activeSheet, filteredRows, lookupColumnIndex, lookupMode, lookupQueries, lookupResultMode, lookupReturnColumnIndex]);

  const duplicateResults = useMemo<DuplicateRowResult[]>(() => {
    if (!activeSheet || !duplicateColumnIndexes.length) return [];

    const counts = new Map<string, number>();
    const keys = filteredRows.map((row) =>
      duplicateColumnIndexes.map((columnIndex) => row.values[columnIndex] ?? '').join(' | '),
    );

    keys.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));

    return filteredRows.map((row, index) => {
      const value = keys[index];
      const duplicateCount = counts.get(value) ?? 0;

      return {
        rowNumber: row.rowNumber,
        value,
        duplicateCount,
        duplicate: duplicateCount > 1,
        row,
      };
    });
  }, [activeSheet, duplicateColumnIndexes, filteredRows]);

  const replacePreview = useMemo<ReplacePreviewRow[]>(() => {
    if (!activeSheet) return [];

    return filteredRows.map((row) => {
      const before = row.values[replaceColumnIndex] ?? '';
      const after = replaceTextByMode(before, replaceFindValue, replaceValue, replaceMode);

      return {
        rowNumber: row.rowNumber,
        before,
        after,
        changed: before !== after,
      };
    });
  }, [activeSheet, filteredRows, replaceColumnIndex, replaceFindValue, replaceMode, replaceValue]);

  const compareResults = useMemo<CompareResult[]>(() => {
    if (!activeSheet || !secondarySheet) return [];

    const primaryMap = new Map<string, string>();
    const secondaryMap = new Map<string, string>();

    filteredRows.forEach((row) => {
      const key = row.values[comparePrimaryKeyColumn] ?? '';
      if (!key) return;
      if (!primaryMap.has(key)) primaryMap.set(key, row.values[comparePrimaryValueColumn] ?? '');
    });

    secondarySheet.rows.forEach((row) => {
      const key = row.values[compareSecondaryKeyColumn] ?? '';
      if (!key) return;
      if (!secondaryMap.has(key)) secondaryMap.set(key, row.values[compareSecondaryValueColumn] ?? '');
    });

    const allKeys = Array.from(new Set([...primaryMap.keys(), ...secondaryMap.keys()]));

    return allKeys.map((key) => {
      const primaryValue = primaryMap.get(key) ?? '';
      const secondaryValue = secondaryMap.get(key) ?? '';

      if (!primaryMap.has(key)) {
        return { key, primaryValue: '', secondaryValue, status: 'missing_in_primary' };
      }

      if (!secondaryMap.has(key)) {
        return { key, primaryValue, secondaryValue: '', status: 'missing_in_secondary' };
      }

      if (normalizeValue(primaryValue) === normalizeValue(secondaryValue)) {
        return { key, primaryValue, secondaryValue, status: 'match' };
      }

      return { key, primaryValue, secondaryValue, status: 'mismatch' };
    });
  }, [
    activeSheet,
    comparePrimaryKeyColumn,
    comparePrimaryValueColumn,
    compareSecondaryKeyColumn,
    compareSecondaryValueColumn,
    filteredRows,
    secondarySheet,
  ]);

  const playgroundResults = useMemo(() => {
    const sum = parseNumbers(playground.numbers).reduce((total, value) => total + value, 0);
    const countif = parseDelimitedValues(playground.countifValues).filter(
      (value) => normalizeValue(value) === normalizeValue(playground.countifCriteria),
    ).length;
    const criteriaRange = parseDelimitedValues(playground.sumifCriteriaRange);
    const sumValues = parseNumbers(playground.sumifValues);
    const sumif = criteriaRange.reduce((total, current, index) => {
      if (normalizeValue(current) !== normalizeValue(playground.sumifCriteria)) return total;
      return total + (sumValues[index] ?? 0);
    }, 0);
    const ifResult = compareValues(
      Number(playground.ifValue || 0),
      playground.ifOperator,
      Number(playground.ifCompareTo || 0),
    )
      ? playground.ifTrueValue
      : playground.ifFalseValue;
    const concat = [playground.concatFirst, playground.concatSecond].filter(Boolean).join(playground.concatDelimiter);

    return { sum, countif, sumif, ifResult, concat };
  }, [playground]);

  const handleWorkbookUpload = async (event: ChangeEvent<HTMLInputElement>, secondary = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const parsed = await readWorkbook(file);

    if (secondary) {
      setSecondaryWorkbook(parsed);
    } else {
      setWorkbook(parsed);
    }

    event.target.value = '';
  };

  const loadDemoWorkbook = async () => {
    const workbookDemo = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(demoWorkbookRows);
    autoFitColumns(worksheet, demoWorkbookRows[0].map((item) => String(item)));
    XLSX.utils.book_append_sheet(workbookDemo, worksheet, 'Danh sach');

    const output = XLSX.write(workbookDemo, { type: 'array', bookType: 'xlsx' });
    const file = new File([output], 'mau-giup-cy-lam-viec.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const parsed = await readWorkbook(file);
    setWorkbook(parsed);
  };

  const addFilterRule = () => {
    setFilterRules((current) => [...current, { columnIndex: 0, mode: 'contains', value: '' }]);
  };

  const updateFilterRule = (index: number, nextRule: FilterRule) => {
    setFilterRules((current) => current.map((rule, ruleIndex) => (ruleIndex === index ? nextRule : rule)));
  };

  const removeFilterRule = (index: number) => {
    setFilterRules((current) => current.filter((_, ruleIndex) => ruleIndex !== index));
  };

  const toggleDuplicateColumn = (columnIndex: number) => {
    setDuplicateColumnIndexes((current) => {
      if (current.includes(columnIndex)) {
        const next = current.filter((item) => item !== columnIndex);
        return next.length ? next : [columnIndex];
      }

      return [...current, columnIndex];
    });
  };

  const exportLookupResults = () => {
    const rows = lookupResults.map((item) => ({
      'Giá trị tra cứu': item.query,
      'Giá trị khớp': item.matchedBy,
      'Kết quả': item.matchValue,
      'Số khớp': item.matchCount,
      'Trạng thái': item.found ? 'Đã khớp' : 'Không khớp',
      Dòng: item.rowNumber ?? '',
    }));

    downloadWorkbook(buildWorkbookFromJson(rows, 'Tra cuu'), 'ket-qua-tra-cuu.xlsx');
  };

  const exportLookupMisses = () => {
    const misses = lookupResults.filter((item) => !item.found);
    const rows = misses.map((item) => ({
      'Giá trị tra cứu': item.query,
      'Trạng thái': 'Không khớp',
    }));

    downloadWorkbook(buildWorkbookFromJson(rows, 'Loi tra cuu'), 'loi-tra-cuu.xlsx');
  };

  const exportDuplicateResults = (duplicatesOnly: boolean) => {
    const selectedRows = duplicateResults.filter((item) => (duplicatesOnly ? item.duplicate : true));
    const rows = selectedRows.map((item) => ({
      Dòng: item.rowNumber,
      'Giá trị khóa': item.value,
      'Số lần lặp': item.duplicateCount,
      'Trạng thái': item.duplicate ? 'Trùng' : 'Không trùng',
    }));

    const highlightIndexes = selectedRows
      .map((item, index) => (item.duplicate ? index : -1))
      .filter((index) => index >= 0);

    downloadWorkbook(
      buildWorkbookFromJson(rows, duplicatesOnly ? 'Dong trung' : 'Kiem tra trung', highlightIndexes),
      duplicatesOnly ? 'dong-trung.xlsx' : 'kiem-tra-trung.xlsx',
    );
  };

  const exportReplacePreview = () => {
    const rows = replacePreview.map((item) => ({
      Dòng: item.rowNumber,
      Trước: item.before,
      Sau: item.after,
      'Trạng thái': item.changed ? 'Sẽ đổi' : 'Giữ nguyên',
    }));

    downloadWorkbook(buildWorkbookFromJson(rows, 'Preview replace'), 'preview-replace.xlsx');
  };

  const exportAppliedReplaceWorkbook = () => {
    if (!activeSheet) return;

    const filteredRowNumbers = new Set(filteredRows.map((row) => row.rowNumber));
    const rows = activeSheet.rows.map((row) => {
      const nextRow: Record<string, string> = {};
      activeSheet.headers.forEach((header, columnIndex) => {
        const originalValue = row.values[columnIndex] ?? '';
        nextRow[header] =
          filteredRowNumbers.has(row.rowNumber) && columnIndex === replaceColumnIndex
            ? replaceTextByMode(originalValue, replaceFindValue, replaceValue, replaceMode)
            : originalValue;
      });
      return nextRow;
    });

    downloadWorkbook(buildWorkbookFromJson(rows, 'Da replace'), 'da-replace.xlsx');
  };

  const exportCompareReport = () => {
    const rows = compareResults.map((item) => ({
      Khóa: item.key,
      'File chính': item.primaryValue,
      'File phụ': item.secondaryValue,
      'Trạng thái':
        item.status === 'match'
          ? 'Khớp'
          : item.status === 'mismatch'
            ? 'Lệch'
            : item.status === 'missing_in_primary'
              ? 'Thiếu ở file chính'
              : 'Thiếu ở file phụ',
    }));

    const highlighted = compareResults
      .map((item, index) => (item.status === 'match' ? -1 : index))
      .filter((index) => index >= 0);

    downloadWorkbook(buildWorkbookFromJson(rows, 'Doi soat', highlighted), 'bao-cao-doi-soat.xlsx');
  };

  const lookupFoundCount = lookupResults.filter((item) => item.found).length;
  const duplicateCount = duplicateResults.filter((item) => item.duplicate).length;
  const replaceChangedCount = replacePreview.filter((item) => item.changed).length;
  const compareSummary = {
    total: compareResults.length,
    match: compareResults.filter((item) => item.status === 'match').length,
    mismatch: compareResults.filter((item) => item.status === 'mismatch').length,
    missing:
      compareResults.filter((item) => item.status === 'missing_in_primary').length +
      compareResults.filter((item) => item.status === 'missing_in_secondary').length,
  };

  return (
    <div className="relative overflow-hidden px-4 pb-24 pt-6 text-white md:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.16),_transparent_28%),linear-gradient(180deg,_rgba(2,6,23,0.92),_rgba(15,23,42,0.98))]" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[32px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.4)] backdrop-blur md:p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Giúp Cy làm việc
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Trợ lý Excel cho công việc hằng ngày</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Một module riêng để xử lý Excel nhanh: tra cứu kiểu VLOOKUP, tìm giá trị lặp có tô đỏ, replace hàng loạt,
                  đối soát 2 file và tra cứu công thức phổ biến.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={`${primaryButtonClass} cursor-pointer`}>
                <Upload className="h-4 w-4" />
                Nạp file Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => void handleWorkbookUpload(event)} />
              </label>
              <button type="button" className={secondaryButtonClass} onClick={() => void loadDemoWorkbook()}>
                <FileSpreadsheet className="h-4 w-4" />
                Tải file mẫu để thử ngay
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className={cardClass}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tệp hiện tại</p>
              <p className="mt-2 text-base font-semibold text-white">{workbook?.fileName ?? 'Chưa có file nào được nạp'}</p>
            </div>
            <div className={cardClass}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Sheet đang thao tác</p>
              <p className="mt-2 text-base font-semibold text-white">{activeSheet?.name ?? 'Chưa chọn sheet'}</p>
            </div>
            <div className={cardClass}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dữ liệu sau lọc</p>
              <p className="mt-2 text-base font-semibold text-white">{filteredRows.length} dòng</p>
            </div>
          </div>
        </motion.section>

        {!activeSheet ? (
          <div className={sectionClass}>
            <p className="text-sm leading-7 text-slate-300">
              Hãy nạp một file Excel hoặc dùng file mẫu để bắt đầu. Sau khi có dữ liệu, Cy sẽ thấy đầy đủ công cụ tra cứu,
              tìm trùng, replace và đối soát.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Nguồn dữ liệu</h2>
                    <p className="text-sm text-slate-300">Chọn sheet và xem nhanh vài dòng đầu trước khi thao tác.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[240px_1fr]">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-200">Chọn sheet để thao tác</label>
                    <select
                      value={activeSheetIndex}
                      onChange={(event) => setActiveSheetIndex(Number(event.target.value))}
                      className={inputClass}
                    >
                      {workbook?.sheets.map((sheet, index) => (
                        <option key={sheet.name} value={index}>
                          {sheet.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-200">Xem nhanh dữ liệu</p>
                      <p className="text-xs text-slate-400">
                        {activeSheet.rows.length} dòng gốc, {filteredRows.length} dòng sau lọc
                      </p>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/45">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-white/[0.04] text-slate-300">
                          <tr>
                            <th className="px-4 py-3">Dòng</th>
                            {activeSheet.headers.map((header) => (
                              <th key={header} className="px-4 py-3">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row) => (
                            <tr key={row.rowNumber} className="border-t border-white/5 text-slate-200">
                              <td className="px-4 py-3 text-slate-400">{row.rowNumber}</td>
                              {row.values.map((value, index) => (
                                <td key={`${row.rowNumber}-${index}`} className="px-4 py-3">
                                  {value || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TiltCard>

              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-400/15 p-3 text-amber-200">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Lọc trước khi xử lý</h2>
                    <p className="text-sm text-slate-300">Mọi thao tác bên dưới sẽ chạy trên vùng dữ liệu đã lọc.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {filterRules.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                      Chưa có điều kiện lọc nào. Nếu không thêm lọc, hệ thống sẽ xử lý toàn bộ sheet hiện tại.
                    </div>
                  ) : null}

                  {filterRules.map((rule, index) => (
                    <div key={`${rule.columnIndex}-${index}`} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <select
                          value={rule.columnIndex}
                          onChange={(event) =>
                            updateFilterRule(index, { ...rule, columnIndex: Number(event.target.value) })
                          }
                          className={inputClass}
                        >
                          {activeSheet.headers.map((header, columnIndex) => (
                            <option key={`${header}-${columnIndex}`} value={columnIndex}>
                              {header}
                            </option>
                          ))}
                        </select>

                        <select
                          value={rule.mode}
                          onChange={(event) =>
                            updateFilterRule(index, { ...rule, mode: event.target.value as LookupMode })
                          }
                          className={inputClass}
                        >
                          {lookupModes.map((mode) => (
                            <option key={mode.value} value={mode.value}>
                              {mode.label}
                            </option>
                          ))}
                        </select>

                        <input
                          value={rule.value}
                          onChange={(event) => updateFilterRule(index, { ...rule, value: event.target.value })}
                          className={inputClass}
                          placeholder="Giá trị lọc"
                        />
                      </div>

                      <button type="button" className={`${secondaryButtonClass} w-full sm:w-fit`} onClick={() => removeFilterRule(index)}>
                        Xóa điều kiện
                      </button>
                    </div>
                  ))}

                  <button type="button" className={`${secondaryButtonClass} w-full`} onClick={addFilterRule}>
                    <Filter className="h-4 w-4" />
                    Thêm điều kiện lọc
                  </button>
                </div>
              </TiltCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Tra cứu kiểu VLOOKUP</h2>
                    <p className="text-sm text-slate-300">Nhập danh sách giá trị cần dò, xem kết quả online và export ngay.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select value={lookupColumnIndex} onChange={(event) => setLookupColumnIndex(Number(event.target.value))} className={inputClass}>
                      {activeSheet.headers.map((header, columnIndex) => (
                        <option key={`${header}-${columnIndex}`} value={columnIndex}>
                          Cột tìm: {header}
                        </option>
                      ))}
                    </select>

                    <select
                      value={lookupReturnColumnIndex}
                      onChange={(event) => setLookupReturnColumnIndex(Number(event.target.value))}
                      className={inputClass}
                    >
                      {activeSheet.headers.map((header, columnIndex) => (
                        <option key={`${header}-${columnIndex}-return`} value={columnIndex}>
                          Cột trả về: {header}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <select value={lookupMode} onChange={(event) => setLookupMode(event.target.value as LookupMode)} className={inputClass}>
                      {lookupModes.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={lookupResultMode}
                      onChange={(event) => setLookupResultMode(event.target.value as LookupResultMode)}
                      className={inputClass}
                    >
                      {lookupResultModes.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={lookupQueries}
                    onChange={(event) => setLookupQueries(event.target.value)}
                    className={`${inputClass} min-h-[130px] resize-y`}
                    placeholder={'Mỗi dòng là một giá trị cần tra cứu, ví dụ:\nNV001\nNV002\nNV003'}
                  />

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" className={`${secondaryButtonClass} w-full`} onClick={exportLookupMisses}>
                      <Download className="h-4 w-4" />
                      Export lỗi tra cứu
                    </button>
                    <button type="button" className={`${primaryButtonClass} w-full`} onClick={exportLookupResults}>
                      <Download className="h-4 w-4" />
                      Export kết quả
                    </button>
                  </div>

                  <p className="text-sm text-slate-300">
                    {lookupFoundCount}/{lookupResults.length} giá trị đã khớp
                  </p>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/45">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-slate-300">
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
                        {lookupResults.map((result) => (
                          <tr key={result.query} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3">{result.query}</td>
                            <td className="px-4 py-3">{result.matchedBy || '—'}</td>
                            <td className="px-4 py-3">
                              <div>{result.matchValue || '—'}</div>
                              {result.allMatchesPreview ? (
                                <div className="mt-1 text-xs text-slate-400">{result.allMatchesPreview}</div>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">{result.matchCount}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  result.found ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'
                                }`}
                              >
                                {result.found ? 'Đã khớp' : 'Không khớp'}
                              </span>
                            </td>
                            <td className="px-4 py-3">{result.rowNumber ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TiltCard>

              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-rose-400/15 p-3 text-rose-200">
                    <TableProperties className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Tìm giá trị lặp</h2>
                    <p className="text-sm text-slate-300">Chọn một hoặc nhiều cột để tạo khóa ghép và phát hiện dữ liệu trùng.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-slate-200">Cột kiểm tra trùng lặp</p>
                    <p className="mt-1 text-sm text-slate-400">Có thể chọn nhiều cột để tạo khóa ghép và tìm trùng chính xác hơn.</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {activeSheet.headers.map((header, columnIndex) => {
                        const active = duplicateColumnIndexes.includes(columnIndex);
                        return (
                          <button
                            key={`${header}-${columnIndex}-duplicate`}
                            type="button"
                            onClick={() => toggleDuplicateColumn(columnIndex)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              active
                                ? 'border-emerald-300/40 bg-emerald-400/10 text-emerald-100'
                                : 'border-white/10 bg-slate-950/35 text-slate-300 hover:bg-white/[0.04]'
                            }`}
                          >
                            {header}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={cardClass}>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tổng dòng</p>
                      <p className="mt-2 text-2xl font-black text-white">{duplicateResults.length}</p>
                    </div>
                    <div className={cardClass}>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dòng bị lặp</p>
                      <p className="mt-2 text-2xl font-black text-rose-200">{duplicateCount}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300">
                    Đang kiểm tra theo khóa: {duplicateColumnIndexes.map((index) => activeSheet.headers[index]).join(' + ')}
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" className={`${secondaryButtonClass} w-full`} onClick={() => exportDuplicateResults(true)}>
                      <Download className="h-4 w-4" />
                      Export dòng trùng
                    </button>
                    <button type="button" className={`${primaryButtonClass} w-full`} onClick={() => exportDuplicateResults(false)}>
                      <Download className="h-4 w-4" />
                      Export kết quả
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/45">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-slate-300">
                        <tr>
                          <th className="px-4 py-3">Dòng</th>
                          <th className="px-4 py-3">Giá trị</th>
                          <th className="px-4 py-3">Số lần lặp</th>
                          <th className="px-4 py-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {duplicateResults.map((result) => (
                          <tr
                            key={`${result.rowNumber}-${result.value}`}
                            className={`border-t border-white/5 ${
                              result.duplicate ? 'bg-rose-500/10 text-rose-50' : 'text-slate-200'
                            }`}
                          >
                            <td className="px-4 py-3">{result.rowNumber}</td>
                            <td className="px-4 py-3">{result.value || '—'}</td>
                            <td className="px-4 py-3">{result.duplicateCount}</td>
                            <td className="px-4 py-3">{result.duplicate ? 'Trùng' : 'Không trùng'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TiltCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-orange-400/15 p-3 text-orange-200">
                    <Replace className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Replace hàng loạt</h2>
                    <p className="text-sm text-slate-300">Xem preview trước và export file đã áp dụng replace thật sự.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <select value={replaceColumnIndex} onChange={(event) => setReplaceColumnIndex(Number(event.target.value))} className={inputClass}>
                    {activeSheet.headers.map((header, columnIndex) => (
                      <option key={`${header}-${columnIndex}-replace`} value={columnIndex}>
                        Cột replace: {header}
                      </option>
                    ))}
                  </select>

                  <select value={replaceMode} onChange={(event) => setReplaceMode(event.target.value as LookupMode)} className={inputClass}>
                    {lookupModes.map((mode) => (
                      <option key={`${mode.value}-replace`} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={replaceFindValue}
                      onChange={(event) => setReplaceFindValue(event.target.value)}
                      className={inputClass}
                      placeholder="Tìm giá trị"
                    />
                    <input
                      value={replaceValue}
                      onChange={(event) => setReplaceValue(event.target.value)}
                      className={inputClass}
                      placeholder="Thay bằng"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={cardClass}>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dòng sẽ đổi</p>
                      <p className="mt-2 text-2xl font-black text-orange-100">{replaceChangedCount}</p>
                    </div>
                    <div className={cardClass}>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dòng giữ nguyên</p>
                      <p className="mt-2 text-2xl font-black text-white">{replacePreview.length - replaceChangedCount}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" className={`${secondaryButtonClass} w-full`} onClick={exportReplacePreview}>
                      <Download className="h-4 w-4" />
                      Export preview
                    </button>
                    <button type="button" className={`${primaryButtonClass} w-full`} onClick={exportAppliedReplaceWorkbook}>
                      <Download className="h-4 w-4" />
                      Export file đã replace
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/45">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-slate-300">
                        <tr>
                          <th className="px-4 py-3">Dòng</th>
                          <th className="px-4 py-3">Trước</th>
                          <th className="px-4 py-3">Sau</th>
                          <th className="px-4 py-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {replacePreview.map((item) => (
                          <tr key={item.rowNumber} className="border-t border-white/5 text-slate-200">
                            <td className="px-4 py-3">{item.rowNumber}</td>
                            <td className="px-4 py-3">{item.before || '—'}</td>
                            <td className="px-4 py-3">{item.after || '—'}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  item.changed ? 'bg-orange-400/15 text-orange-100' : 'bg-white/10 text-slate-300'
                                }`}
                              >
                                {item.changed ? 'Sẽ đổi' : 'Giữ nguyên'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TiltCard>

              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-400/15 p-3 text-violet-200">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Đối soát 2 file</h2>
                    <p className="text-sm text-slate-300">So key và value giữa file chính và file phụ để tìm chênh lệch.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className={`${secondaryButtonClass} w-full cursor-pointer`}>
                    <Upload className="h-4 w-4" />
                    Tải file phụ để đối soát
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(event) => void handleWorkbookUpload(event, true)}
                    />
                  </label>

                  <div className={cardClass}>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">File phụ</p>
                    <p className="mt-2 text-base font-semibold text-white">{secondaryWorkbook?.fileName ?? 'Chưa có file phụ'}</p>
                  </div>

                  {secondarySheet ? (
                    <>
                      <select
                        value={secondarySheetIndex}
                        onChange={(event) => setSecondarySheetIndex(Number(event.target.value))}
                        className={inputClass}
                      >
                        {secondaryWorkbook?.sheets.map((sheet, index) => (
                          <option key={`${sheet.name}-${index}`} value={index}>
                            Sheet phụ: {sheet.name}
                          </option>
                        ))}
                      </select>

                      <div className="grid gap-3 md:grid-cols-2">
                        <select
                          value={comparePrimaryKeyColumn}
                          onChange={(event) => setComparePrimaryKeyColumn(Number(event.target.value))}
                          className={inputClass}
                        >
                          {activeSheet.headers.map((header, columnIndex) => (
                            <option key={`${header}-${columnIndex}-primary-key`} value={columnIndex}>
                              File chính key: {header}
                            </option>
                          ))}
                        </select>
                        <select
                          value={comparePrimaryValueColumn}
                          onChange={(event) => setComparePrimaryValueColumn(Number(event.target.value))}
                          className={inputClass}
                        >
                          {activeSheet.headers.map((header, columnIndex) => (
                            <option key={`${header}-${columnIndex}-primary-value`} value={columnIndex}>
                              File chính value: {header}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <select
                          value={compareSecondaryKeyColumn}
                          onChange={(event) => setCompareSecondaryKeyColumn(Number(event.target.value))}
                          className={inputClass}
                        >
                          {secondarySheet.headers.map((header, columnIndex) => (
                            <option key={`${header}-${columnIndex}-secondary-key`} value={columnIndex}>
                              File phụ key: {header}
                            </option>
                          ))}
                        </select>
                        <select
                          value={compareSecondaryValueColumn}
                          onChange={(event) => setCompareSecondaryValueColumn(Number(event.target.value))}
                          className={inputClass}
                        >
                          {secondarySheet.headers.map((header, columnIndex) => (
                            <option key={`${header}-${columnIndex}-secondary-value`} value={columnIndex}>
                              File phụ value: {header}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className={cardClass}>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tổng khóa</p>
                          <p className="mt-2 text-2xl font-black text-white">{compareSummary.total}</p>
                        </div>
                        <div className={cardClass}>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Khớp</p>
                          <p className="mt-2 text-2xl font-black text-emerald-100">{compareSummary.match}</p>
                        </div>
                        <div className={cardClass}>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lệch</p>
                          <p className="mt-2 text-2xl font-black text-amber-100">{compareSummary.mismatch}</p>
                        </div>
                        <div className={cardClass}>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thiếu</p>
                          <p className="mt-2 text-2xl font-black text-rose-100">{compareSummary.missing}</p>
                        </div>
                      </div>

                      <button type="button" className={`${primaryButtonClass} w-full`} onClick={exportCompareReport}>
                        <Download className="h-4 w-4" />
                        Export báo cáo đối soát
                      </button>

                      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/45">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-white/[0.04] text-slate-300">
                            <tr>
                              <th className="px-4 py-3">Khóa</th>
                              <th className="px-4 py-3">File chính</th>
                              <th className="px-4 py-3">File phụ</th>
                              <th className="px-4 py-3">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compareResults.map((item) => (
                              <tr key={item.key} className="border-t border-white/5 text-slate-200">
                                <td className="px-4 py-3">{item.key}</td>
                                <td className="px-4 py-3">{item.primaryValue || '—'}</td>
                                <td className="px-4 py-3">{item.secondaryValue || '—'}</td>
                                <td className="px-4 py-3">
                                  {item.status === 'match'
                                    ? 'Khớp'
                                    : item.status === 'mismatch'
                                      ? 'Lệch'
                                      : item.status === 'missing_in_primary'
                                        ? 'Thiếu ở file chính'
                                        : 'Thiếu ở file phụ'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                      Nạp thêm file phụ để mở phần đối soát.
                    </div>
                  )}
                </div>
              </TiltCard>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-400/15 p-3 text-sky-200">
                    <Sigma className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Tra cứu công thức phổ biến</h2>
                    <p className="text-sm text-slate-300">Các công thức hay dùng và khu thao tác thử để Cy xem nhanh.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {formulaGuides.map((guide) => (
                    <div key={guide.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-white">{guide.name}</h3>
                        <span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-200">{guide.category}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{guide.description}</p>
                      <code className="mt-3 block rounded-2xl bg-slate-950/50 px-4 py-3 text-xs text-emerald-200">{guide.syntax}</code>
                      <p className="mt-3 text-sm text-slate-400">Ví dụ: {guide.example}</p>
                      <a
                        href={guide.source}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-emerald-200 hover:text-emerald-100"
                      >
                        Mở tài liệu tham khảo
                      </a>
                    </div>
                  ))}
                </div>
              </TiltCard>

              <TiltCard className={sectionClass}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-fuchsia-400/15 p-3 text-fuchsia-200">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Thao tác thử</h2>
                    <p className="text-sm text-slate-300">Điền giá trị mẫu để xem ngay công thức chạy ra kết quả gì.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={playground.numbers}
                      onChange={(event) => setPlayground((current) => ({ ...current, numbers: event.target.value }))}
                      className={inputClass}
                      placeholder="SUM: 100, 200, 300"
                    />
                    <div className={cardClass}>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">SUM</p>
                      <p className="mt-2 text-xl font-bold text-white">{playgroundResults.sum.toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={playground.countifValues}
                      onChange={(event) => setPlayground((current) => ({ ...current, countifValues: event.target.value }))}
                      className={inputClass}
                      placeholder="COUNTIF: Nam, Cy, Nam"
                    />
                    <input
                      value={playground.countifCriteria}
                      onChange={(event) => setPlayground((current) => ({ ...current, countifCriteria: event.target.value }))}
                      className={inputClass}
                      placeholder="Tiêu chí COUNTIF"
                    />
                  </div>

                  <div className={cardClass}>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">COUNTIF</p>
                    <p className="mt-2 text-xl font-bold text-white">{playgroundResults.countif}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={playground.sumifCriteriaRange}
                      onChange={(event) => setPlayground((current) => ({ ...current, sumifCriteriaRange: event.target.value }))}
                      className={inputClass}
                      placeholder="Range điều kiện"
                    />
                    <input
                      value={playground.sumifCriteria}
                      onChange={(event) => setPlayground((current) => ({ ...current, sumifCriteria: event.target.value }))}
                      className={inputClass}
                      placeholder="Điều kiện SUMIF"
                    />
                    <input
                      value={playground.sumifValues}
                      onChange={(event) => setPlayground((current) => ({ ...current, sumifValues: event.target.value }))}
                      className={inputClass}
                      placeholder="Range cần cộng"
                    />
                  </div>

                  <div className={cardClass}>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">SUMIF</p>
                    <p className="mt-2 text-xl font-bold text-white">{playgroundResults.sumif.toLocaleString('vi-VN')}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={playground.ifValue}
                      onChange={(event) => setPlayground((current) => ({ ...current, ifValue: event.target.value }))}
                      className={inputClass}
                      placeholder="Giá trị cần so"
                    />
                    <select
                      value={playground.ifOperator}
                      onChange={(event) => setPlayground((current) => ({ ...current, ifOperator: event.target.value }))}
                      className={inputClass}
                    >
                      {['>=', '>', '<=', '<', '=', '!='].map((operator) => (
                        <option key={operator} value={operator}>
                          {operator}
                        </option>
                      ))}
                    </select>
                    <input
                      value={playground.ifCompareTo}
                      onChange={(event) => setPlayground((current) => ({ ...current, ifCompareTo: event.target.value }))}
                      className={inputClass}
                      placeholder="So với"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={playground.ifTrueValue}
                      onChange={(event) => setPlayground((current) => ({ ...current, ifTrueValue: event.target.value }))}
                      className={inputClass}
                      placeholder="Nếu đúng"
                    />
                    <input
                      value={playground.ifFalseValue}
                      onChange={(event) => setPlayground((current) => ({ ...current, ifFalseValue: event.target.value }))}
                      className={inputClass}
                      placeholder="Nếu sai"
                    />
                  </div>

                  <div className={cardClass}>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">IF</p>
                    <p className="mt-2 text-xl font-bold text-white">{playgroundResults.ifResult}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={playground.concatFirst}
                      onChange={(event) => setPlayground((current) => ({ ...current, concatFirst: event.target.value }))}
                      className={inputClass}
                      placeholder="Text 1"
                    />
                    <input
                      value={playground.concatDelimiter}
                      onChange={(event) => setPlayground((current) => ({ ...current, concatDelimiter: event.target.value }))}
                      className={inputClass}
                      placeholder="Ký tự nối"
                    />
                    <input
                      value={playground.concatSecond}
                      onChange={(event) => setPlayground((current) => ({ ...current, concatSecond: event.target.value }))}
                      className={inputClass}
                      placeholder="Text 2"
                    />
                  </div>

                  <div className={cardClass}>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CONCAT</p>
                    <p className="mt-2 text-xl font-bold text-white">{playgroundResults.concat}</p>
                  </div>
                </div>
              </TiltCard>
            </div>

            <TiltCard className={sectionClass}>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">GIF minh họa thao tác</h2>
                  <p className="text-sm text-slate-300">Một vài GIF tham khảo để Cy hình dung nhanh cách thao tác với bảng tính.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {demoGifs.map((gif) => (
                  <div key={gif.title} className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
                    <div className="aspect-[4/3] overflow-hidden bg-slate-950/40">
                      <iframe
                        src={gif.embedUrl}
                        title={gif.title}
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white">{gif.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{gif.description}</p>
                      <a href={gif.source} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-emerald-200 hover:text-emerald-100">
                        Mở nguồn GIF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </TiltCard>
          </>
        )}
      </div>
    </div>
  );
}
