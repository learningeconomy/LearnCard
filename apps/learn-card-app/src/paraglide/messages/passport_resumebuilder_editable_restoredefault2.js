/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Editable_Restoredefault2Inputs */

const en_passport_resumebuilder_editable_restoredefault2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Restoredefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restore Default`)
};

const es_passport_resumebuilder_editable_restoredefault2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Restoredefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurar predeterminado`)
};

const fr_passport_resumebuilder_editable_restoredefault2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Restoredefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rétablir par défaut`)
};

const ar_passport_resumebuilder_editable_restoredefault2 = /** @type {(inputs: Passport_Resumebuilder_Editable_Restoredefault2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الافتراضي`)
};

/**
* | output |
* | --- |
* | "Restore Default" |
*
* @param {Passport_Resumebuilder_Editable_Restoredefault2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_editable_restoredefault2 = /** @type {((inputs?: Passport_Resumebuilder_Editable_Restoredefault2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Editable_Restoredefault2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_editable_restoredefault2(inputs)
	if (locale === "es") return es_passport_resumebuilder_editable_restoredefault2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_editable_restoredefault2(inputs)
	return ar_passport_resumebuilder_editable_restoredefault2(inputs)
});
export { passport_resumebuilder_editable_restoredefault2 as "passport.resumeBuilder.editable.restoreDefault" }