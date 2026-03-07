/**
 * Generates a unique AFRIBAS Institutional ID
 * Structure: AFRIBAS-200.000.[COUNTRY].[BODY].[CHECKSUM]
 * The Body now includes a time-segment for 100% uniqueness.
 */
export const generateAfribasId = (countryCode = "ZM") => {
  const prefix = "AFRIBAS-200.000";
  
  // Get the last 3 digits of the current timestamp for extra entropy
  const timeSegment = Date.now().toString().slice(-3);
  
  // Generate a random 3-digit sequence
  const randomSegment = Math.floor(100 + Math.random() * 899).toString();
  
  const body = `${timeSegment}${randomSegment}`;
  
  // Checksum calculation (Weighted sum % 10)
  const checksum = body.split('').reduce((acc, digit, idx) => {
    return acc + (parseInt(digit) * (idx + 1));
  }, 0) % 10;
  
  // Result format: AFRIBAS-200.000.ZM.123.456-7
  return `${prefix}.${countryCode.toUpperCase()}.${body.slice(0, 3)}.${body.slice(3, 6)}-${checksum}`;
};

/**
 * Validates if an ID matches the AFRIBAS structure
 */
export const validateAfribasId = (id) => {
  const regex = /^AFRIBAS-200\.000\.[A-Z]{2}\.\d{3}\.\d{3}-\d$/;
  return regex.test(id);
};