/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Editdraft2Inputs */

const en_scoutsid_editdraft2 = /** @type {(inputs: Scoutsid_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Draft`)
};

const es_scoutsid_editdraft2 = /** @type {(inputs: Scoutsid_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar Borrador`)
};

const fr_scoutsid_editdraft2 = /** @type {(inputs: Scoutsid_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le brouillon`)
};

const ar_scoutsid_editdraft2 = /** @type {(inputs: Scoutsid_Editdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Draft`)
};

/**
* | output |
* | --- |
* | "Edit Draft" |
*
* @param {Scoutsid_Editdraft2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_editdraft2 = /** @type {((inputs?: Scoutsid_Editdraft2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Editdraft2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_editdraft2(inputs)
	if (locale === "es") return es_scoutsid_editdraft2(inputs)
	if (locale === "fr") return fr_scoutsid_editdraft2(inputs)
	return ar_scoutsid_editdraft2(inputs)
});
export { scoutsid_editdraft2 as "scoutsId.editDraft" }