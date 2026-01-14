export interface TrackedIssue {
  id: string;
  title: string;
  status: string;
  assignee?: string;
  issueType?: string;
  updatedAt?: string;
  priority?: number;
}

export interface Convoy {
  id: string;
  title: string;
  status: string;
  progress: {
    completed: number;
    total: number;
  };
  trackedIssues: TrackedIssue[];
}