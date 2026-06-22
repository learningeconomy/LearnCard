/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Devdocs_Title2Inputs */

const en_admintools_devdocs_title2 = /** @type {(inputs: Admintools_Devdocs_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Want to learn more?`)
};

const es_admintools_devdocs_title2 = /** @type {(inputs: Admintools_Devdocs_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Quieres saber más?`)
};

const fr_admintools_devdocs_title2 = /** @type {(inputs: Admintools_Devdocs_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envie d'en savoir plus ?`)
};

const ar_admintools_devdocs_title2 = /** @type {(inputs: Admintools_Devdocs_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل تريد معرفة المزيد؟`)
};

/**
* | output |
* | --- |
* | "Want to learn more?" |
*
* @param {Admintools_Devdocs_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_devdocs_title2 = /** @type {((inputs?: Admintools_Devdocs_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Devdocs_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_devdocs_title2(inputs)
	if (locale === "es") return es_admintools_devdocs_title2(inputs)
	if (locale === "fr") return fr_admintools_devdocs_title2(inputs)
	return ar_admintools_devdocs_title2(inputs)
});
export { admintools_devdocs_title2 as "adminTools.devDocs.title" }