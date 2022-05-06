declare const fuzzyMatch: (pattern: any, str: any) => {
    matched: boolean;
    score: number;
};
export default fuzzyMatch;
