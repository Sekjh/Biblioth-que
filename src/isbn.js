export function validateIsbn(isbn) {
  if (isbn.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10 === parseInt(isbn[12]);
  }
  if (isbn.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(isbn[i]) * (10 - i);
    const check = isbn[9].toUpperCase() === 'X' ? 10 : parseInt(isbn[9]);
    return (sum + check) % 11 === 0;
  }
  return false;
}

export function isbn13to10(isbn13) {
  if (!isbn13.startsWith('978') || isbn13.length !== 13) return null;
  const core = isbn13.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * parseInt(core[i]);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : check);
}
