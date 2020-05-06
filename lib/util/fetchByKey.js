function get(key, obj) {
  if (key === '') {
    return obj;
  }

  try {
    const result = key.split('.').reduce((o, i) => o[i], obj);
    if (result) {
      return result;
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}

  return null;
}

module.exports = get;
