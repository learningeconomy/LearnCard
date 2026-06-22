/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Delete_TitleInputs */

const en_endorsement_delete_title = /** @type {(inputs: Endorsement_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Endorsement?`)
};

const es_endorsement_delete_title = /** @type {(inputs: Endorsement_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Eliminar aval?`)
};

const fr_endorsement_delete_title = /** @type {(inputs: Endorsement_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer la recommandation ?`)
};

const ar_endorsement_delete_title = /** @type {(inputs: Endorsement_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف التوصية؟`)
};

/**
* | output |
* | --- |
* | "Delete Endorsement?" |
*
* @param {Endorsement_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_delete_title = /** @type {((inputs?: Endorsement_Delete_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Delete_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_delete_title(inputs)
	if (locale === "es") return es_endorsement_delete_title(inputs)
	if (locale === "fr") return fr_endorsement_delete_title(inputs)
	return ar_endorsement_delete_title(inputs)
});
export { endorsement_delete_title as "endorsement.delete.title" }