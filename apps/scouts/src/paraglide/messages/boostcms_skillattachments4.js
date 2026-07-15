/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Skillattachments4Inputs */

const en_boostcms_skillattachments4 = /** @type {(inputs: Boostcms_Skillattachments4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill Attachments`)
};

const es_boostcms_skillattachments4 = /** @type {(inputs: Boostcms_Skillattachments4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adjuntos de Habilidades`)
};

const fr_boostcms_skillattachments4 = /** @type {(inputs: Boostcms_Skillattachments4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pièces jointes de compétences`)
};

const ar_boostcms_skillattachments4 = /** @type {(inputs: Boostcms_Skillattachments4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill Attachments`)
};

/**
* | output |
* | --- |
* | "Skill Attachments" |
*
* @param {Boostcms_Skillattachments4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_skillattachments4 = /** @type {((inputs?: Boostcms_Skillattachments4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Skillattachments4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_skillattachments4(inputs)
	if (locale === "es") return es_boostcms_skillattachments4(inputs)
	if (locale === "fr") return fr_boostcms_skillattachments4(inputs)
	return ar_boostcms_skillattachments4(inputs)
});
export { boostcms_skillattachments4 as "boostCMS.skillAttachments" }