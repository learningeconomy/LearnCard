/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Launchdevdocs3Inputs */

const en_admintools_launchdevdocs3 = /** @type {(inputs: Admintools_Launchdevdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Developer Docs`)
};

const es_admintools_launchdevdocs3 = /** @type {(inputs: Admintools_Launchdevdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir Documentación`)
};

const fr_admintools_launchdevdocs3 = /** @type {(inputs: Admintools_Launchdevdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer la documentation développeur`)
};

const ar_admintools_launchdevdocs3 = /** @type {(inputs: Admintools_Launchdevdocs3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح وثائق المطورين`)
};

/**
* | output |
* | --- |
* | "Launch Developer Docs" |
*
* @param {Admintools_Launchdevdocs3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_launchdevdocs3 = /** @type {((inputs?: Admintools_Launchdevdocs3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Launchdevdocs3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_launchdevdocs3(inputs)
	if (locale === "es") return es_admintools_launchdevdocs3(inputs)
	if (locale === "fr") return fr_admintools_launchdevdocs3(inputs)
	return ar_admintools_launchdevdocs3(inputs)
});
export { admintools_launchdevdocs3 as "adminTools.launchDevDocs" }