let counter = 0;

function renderCounter(base) {
    let value = (++counter);
    return value.toString(base || 10);
}

function renderTime(base) {
	let value = Date.now();
	return value.toString(base || 10);
}

function renderRandom(base) {
    let value = Math.floor(1e+16 + 9e+16 * Math.random());
	return value.toString(base || 10);
}

export function GenerateId(base, separator) {
    if (separator == null) {
        separator = '-';
    }
	return renderCounter(base) + separator + renderTime(base) + separator + renderRandom(base);
}
