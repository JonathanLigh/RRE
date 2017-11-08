function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}

module.exports = {
    uuid: function(name) {
        return '/r/' + name + '_' + s4() + s4() + '_' + s4() + '_' + s4() + '_' + s4() + '_' + s4() + s4() + s4() + '/';
    }
}
