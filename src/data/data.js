const DATA = [];

var count = 25;

for (let index = 0; index < count; index++) {
    DATA.push({ id: index, name: 'index-' + index, text: 'text-' + index });
}

export { DATA };