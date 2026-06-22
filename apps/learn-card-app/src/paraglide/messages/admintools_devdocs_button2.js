/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Devdocs_Button2Inputs */

const en_admintools_devdocs_button2 = /** @type {(inputs: Admintools_Devdocs_Button2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Developer Docs`)
};

const es_admintools_devdocs_button2 = /** @type {(inputs: Admintools_Devdocs_Button2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir documentación para desarrolladores`)
};

const fr_admintools_devdocs_button2 = /** @type {(inputs: Admintools_Devdocs_Button2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir la documentation développeur`)
};

const ar_admintools_devdocs_button2 = /** @type {(inputs: Admintools_Devdocs_Button2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح وثائق المطوّرين`)
};

/**
* | output |
* | --- |
* | "Launch Developer Docs" |
*
* @param {Admintools_Devdocs_Button2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_devdocs_button2 = /** @type {((inputs?: Admintools_Devdocs_Button2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Devdocs_Button2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_devdocs_button2(inputs)
	if (locale === "es") return es_admintools_devdocs_button2(inputs)
	if (locale === "fr") return fr_admintools_devdocs_button2(inputs)
	return ar_admintools_devdocs_button2(inputs)
});
export { admintools_devdocs_button2 as "adminTools.devDocs.button" }