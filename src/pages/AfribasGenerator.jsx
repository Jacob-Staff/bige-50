/**
 * Generates a unique AFRIBAS Institutional ID
 * Structure: AFRIBAS-200.000.[COUNTRY].[RANDOM].[CHECKSUM]
 */
export const generateAfribasId = (countryCode = "ZM") => {
  const prefix = "AFRIBAS-200.000";
  // Generate a random 6-digit sequence
  const body = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Simple Checksum (Luhn-inspired)
  const checksum = body.split('').reduce((acc, digit) => acc + parseInt(digit), 0) % 10;
  
  return `${prefix}.${countryCode}.${body.slice(0, 3)}.${body.slice(3, 6)}-${checksum}`;
};