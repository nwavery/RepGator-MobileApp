/**
 * Maps US state codes to their full names.
 */
const stateCodeToName: { [key: string]: string } = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    // Add territories if needed
    DC: 'District of Columbia', PR: 'Puerto Rico',
};

/**
 * Gets the full state name from a two-letter code.
 * @param code - The two-letter state code (e.g., 'OK').
 * @returns The full state name or the code if not found.
 */
export const getStateFullName = (code: string): string => {
    return stateCodeToName[code.toUpperCase()] || code;
};

/**
 * Converts a number string to its ordinal representation (e.g., '3' -> '3rd').
 * @param numStr - The number as a string (e.g., '03', '40').
 * @returns The ordinal string.
 */
export const getOrdinalNumber = (numStr: string): string => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) {
        return numStr; // Return original if not a number
    }

    const j = num % 10;
    const k = num % 100;

    if (j === 1 && k !== 11) {
        return num + 'st';
    }
    if (j === 2 && k !== 12) {
        return num + 'nd';
    }
    if (j === 3 && k !== 13) {
        return num + 'rd';
    }
    return num + 'th';
};

/**
 * Formats a district ID (e.g., 'OK03') into a readable string.
 * @param districtId - The district ID string.
 * @returns The formatted string (e.g., "From Oklahoma's 3rd District") or a fallback.
 */
export const formatDistrictId = (districtId: string | null | undefined): string => {
    if (!districtId || districtId.length < 3) {
        return 'District not assigned';
    }

    // Assume format: 2-letter state code + digits
    const stateCode = districtId.substring(0, 2).toUpperCase();
    const districtNumStr = districtId.substring(2);

    // Basic validation for the numeric part
    if (!/^\d+$/.test(districtNumStr)) {
         return 'District not assigned'; // Or handle invalid format differently
    }

    const stateName = getStateFullName(stateCode);
    const ordinalNum = getOrdinalNumber(districtNumStr);

    return `From ${stateName}'s ${ordinalNum} District`;
}; 