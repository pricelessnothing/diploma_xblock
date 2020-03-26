class Errors {
    constructor(locale = 'en') {
        this.locale = locale
    }

    get() {
        return this.errors[this.locale]
    }

    errors = {
        en: {
            'inst-no-assignment': 'Assignment operator in instruction expected'
        }
    }
}