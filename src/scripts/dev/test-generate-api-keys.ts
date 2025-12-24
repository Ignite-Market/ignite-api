import { exit } from 'process';
import * as fs from 'fs';
import * as path from 'path';
import { generateApiKeys, SignerPubkey } from '../../lib/generate-api-keys';

const INPUT_FILE = path.join(__dirname, '../../lib/proxy/signer_pubkeys.csv');
const PUBLIC_OUTPUT_FILE = path.join(__dirname, '../../lib/api_keys_encrypted.csv');
const PRIVATE_OUTPUT_FILE = path.join(__dirname, '../../lib/api_keys_raw.csv');

function parseCsv(filePath: string): SignerPubkey[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim());
  const addressColIndex = headers.findIndex((h) => h === 'signing_address' || h === 'voter_signing_address');
  const pubkeyColIndex = headers.findIndex((h) => h === 'recovered_pubkey_hex');

  if (addressColIndex === -1) {
    throw new Error('CSV must contain signing_address or voter_signing_address column');
  }
  if (pubkeyColIndex === -1) {
    throw new Error('CSV must contain recovered_pubkey_hex column');
  }

  const addressColName = headers[addressColIndex];
  const signers: SignerPubkey[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',');
    const signingAddress = values[addressColIndex]?.trim();
    const pubkeyHex = values[pubkeyColIndex]?.trim();

    if (!signingAddress || !pubkeyHex) {
      console.warn(`Skipping row ${i + 1}: missing signing_address or recovered_pubkey_hex`);
      continue;
    }

    const signer: SignerPubkey = {
      recovered_pubkey_hex: pubkeyHex
    };

    if (addressColName === 'signing_address') {
      signer.signing_address = signingAddress;
    } else {
      signer.voter_signing_address = signingAddress;
    }

    signers.push(signer);
  }

  return signers;
}

function writeCsv(filePath: string, headers: string[], rows: string[][]): void {
  const lines: string[] = [];
  lines.push(headers.join(','));
  rows.forEach((row) => {
    lines.push(row.join(','));
  });
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf-8');
}

(async () => {
  try {
    // Check if input file exists
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Input file not found: ${INPUT_FILE}`);
      exit(1);
    }

    // Check if output files already exist (refuse to overwrite like Python version)
    if (fs.existsSync(PUBLIC_OUTPUT_FILE) || fs.existsSync(PRIVATE_OUTPUT_FILE)) {
      console.error(`Refusing to overwrite ${PUBLIC_OUTPUT_FILE} or ${PRIVATE_OUTPUT_FILE}. ` + 'Delete them first if you want to regenerate.');
      exit(1);
    }

    console.log('Reading CSV file:', INPUT_FILE);
    const signers = parseCsv(INPUT_FILE);
    console.log(`Parsed ${signers.length} signers from CSV\n`);

    console.log('Generating API keys...');
    const results = generateApiKeys(signers);
    console.log(`Generated ${results.length} API keys\n`);

    // Prepare CSV data
    const encryptedRows: string[][] = [];
    const rawRows: string[][] = [];

    results.forEach((result) => {
      encryptedRows.push([result.signing_address, result.encrypted_api_key]);
      rawRows.push([result.signing_address, result.api_key]);
    });

    // Write CSV files
    console.log('Writing CSV files...');
    writeCsv(PUBLIC_OUTPUT_FILE, ['signing_address', 'encrypted_api_key'], encryptedRows);
    writeCsv(PRIVATE_OUTPUT_FILE, ['signing_address', 'api_key'], rawRows);

    console.log(`Generated ${results.length} API keys. ` + `Public: ${PUBLIC_OUTPUT_FILE}, Private: ${PRIVATE_OUTPUT_FILE}`);

    exit(0);
  } catch (err) {
    console.error('Error:', err);
    exit(1);
  }
})();
