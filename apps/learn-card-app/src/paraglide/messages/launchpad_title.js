/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_TitleInputs */

const en_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps`)
};

const es_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicaciones`)
};

const de_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anwendungen`)
};

const ar_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التطبيقات`)
};

const fr_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Applications`)
};

const ko_launchpad_title = /** @type {(inputs: Launchpad_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`앱`)
};

/**
* | output |
* | --- |
* | "Apps" |
*
* @param {Launchpad_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_title = /** @type {((inputs?: Launchpad_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_title(inputs)
	if (locale === "es") return es_launchpad_title(inputs)
	if (locale === "de") return de_launchpad_title(inputs)
	if (locale === "ar") return ar_launchpad_title(inputs)
	if (locale === "fr") return fr_launchpad_title(inputs)
	return ko_launchpad_title(inputs)
});
export { launchpad_title as "launchpad.title" }