
export interface Solution {
  id: string;
  questionText: string;
  questionImage?: string;
  solution: string;
  timestamp: number;
}

export enum Page {
  Home,
  Solve,
  History
}
