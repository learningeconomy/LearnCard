/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_TitleInputs */

const en_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const es_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const de_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const ar_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التطبيقات`)
};

/**
* | output |
* | --- |
* | "Apps" |
*
* @param {Launchpad_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_title = /** @type {((inputs?: Launchpad_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_TitleInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_title(inputs)
	if (locale === "es") return es_launchpad_title(inputs)
	if (locale === "de") return de_launchpad_title(inputs)
	return ar_launchpad_title(inputs)
});
export { launchpad_title as "launchpad.title" }