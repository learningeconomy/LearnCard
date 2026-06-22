/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_PassportInputs */

const en_launchpad_passport = /** @type {(inputs: Launchpad_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passport`)
};

const es_launchpad_passport = /** @type {(inputs: Launchpad_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pasaporte`)
};

const fr_launchpad_passport = /** @type {(inputs: Launchpad_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passeport`)
};

const ar_launchpad_passport = /** @type {(inputs: Launchpad_PassportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جواز السفر`)
};

/**
* | output |
* | --- |
* | "Passport" |
*
* @param {Launchpad_PassportInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_passport = /** @type {((inputs?: Launchpad_PassportInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_PassportInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_passport(inputs)
	if (locale === "es") return es_launchpad_passport(inputs)
	if (locale === "fr") return fr_launchpad_passport(inputs)
	return ar_launchpad_passport(inputs)
});
export { launchpad_passport as "launchpad.passport" }