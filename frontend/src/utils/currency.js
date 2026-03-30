// Currency formatting utility for Rwandan Franc (RWF)
export const formatRWF = (amount) => {
  if (amount === null || amount === undefined) return "RWF 0";
  const num = parseFloat(amount);
  if (isNaN(num)) return "RWF 0";
  return `RWF ${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatRWFShort = (amount) => {
  if (amount === null || amount === undefined) return "0";
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const parseRWF = (str) => {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/[^0-9.-]+/g, "")) || 0;
};
