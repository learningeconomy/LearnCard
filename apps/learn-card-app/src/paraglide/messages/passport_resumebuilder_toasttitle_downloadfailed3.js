/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs */

const en_passport_resumebuilder_toasttitle_downloadfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download Failed`)
};

const es_passport_resumebuilder_toasttitle_downloadfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al descargar`)
};

const fr_passport_resumebuilder_toasttitle_downloadfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec du téléchargement`)
};

const ar_passport_resumebuilder_toasttitle_downloadfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل التنزيل`)
};

/**
* | output |
* | --- |
* | "Download Failed" |
*
* @param {Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_toasttitle_downloadfailed3 = /** @type {((inputs?: Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Toasttitle_Downloadfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_toasttitle_downloadfailed3(inputs)
	if (locale === "es") return es_passport_resumebuilder_toasttitle_downloadfailed3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_toasttitle_downloadfailed3(inputs)
	return ar_passport_resumebuilder_toasttitle_downloadfailed3(inputs)
});
export { passport_resumebuilder_toasttitle_downloadfailed3 as "passport.resumeBuilder.toastTitle.downloadFailed" }