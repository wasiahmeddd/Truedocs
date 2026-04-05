import Dexie, { type Table } from "dexie";

export interface LocalUser {
  id?: number;
  username: string;
  password: string;
  salt: string;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: Date;
  lastActive?: Date | null;
  keyPublic?: string | null;
  keyPrivateEncrypted?: string | null;
  keySalt?: string | null;
}

export interface LocalPerson {
  id?: number;
  name: string;
  userId: number;
}

export interface LocalCard {
  id?: number;
  personId: number;
  type: string;
  filename: string;
  originalName?: string | null;
  title?: string | null;
  documentNumber?: string | null;
  documentName?: string | null;
}

export interface LocalCardType {
  id?: number;
  userId: number;
  slug: string;
  label: string;
  description?: string | null;
  icon: string;
  color: string;
}

export interface LocalWallet {
  id?: number;
  userId: number;
  walletName: string;
  wordCount: number;
  encryptedSeedPhrase: ArrayBuffer;
  iv: Uint8Array;
  createdAt: Date;
  deletedAt?: Date | null;
}

export interface LocalFile {
  id?: number;
  cardId: number;
  originalName: string;
  mimeType: string;
  size: number;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
}

const DEFAULT_CARD_TYPES = [
  {
    slug: "aadhaar",
    label: "Aadhaar Card",
    description: "Biometric identity proof",
    icon: "Fingerprint",
    color: "text-orange-500 bg-orange-500/10",
  },
  {
    slug: "pan",
    label: "PAN Card",
    description: "Tax identification",
    icon: "CreditCard",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    slug: "voterid",
    label: "Voter ID",
    description: "Election commission ID",
    icon: "FileBadge",
    color: "text-green-500 bg-green-500/10",
  },
  {
    slug: "ration",
    label: "Ration Card",
    description: "Essential commodities",
    icon: "ShoppingBasket",
    color: "text-yellow-500 bg-yellow-500/10",
  },
  {
    slug: "marks",
    label: "Marks Card",
    description: "Academic Records",
    icon: "GraduationCap",
    color: "text-pink-500 bg-pink-500/10",
  },
] as const;

class LocalVaultDB extends Dexie {
  users!: Table<LocalUser, number>;
  people!: Table<LocalPerson, number>;
  cards!: Table<LocalCard, number>;
  cardTypes!: Table<LocalCardType, number>;
  cryptoWallets!: Table<LocalWallet, number>;
  files!: Table<LocalFile, number>;

  constructor() {
    super("true-docs-local");

    this.version(1).stores({
      users: "++id,&username",
      people: "++id,userId,name",
      cards: "++id,personId,type",
      cardTypes: "++id,userId,[userId+slug]",
      cryptoWallets: "++id,userId,deletedAt,[userId+deletedAt]",
      files: "++id,&cardId",
    });
  }
}

export const localDb = new LocalVaultDB();

export async function ensureDefaultCardTypes(userId: number): Promise<void> {
  const existing = await localDb.cardTypes.where("userId").equals(userId).count();
  if (existing > 0) {
    return;
  }

  await localDb.cardTypes.bulkAdd(
    DEFAULT_CARD_TYPES.map((cardType) => ({
      ...cardType,
      userId,
    })),
  );
}
