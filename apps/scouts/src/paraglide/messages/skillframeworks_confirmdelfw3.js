/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Confirmdelfw3Inputs */

const en_skillframeworks_confirmdelfw3 = /** @type {(inputs: Skillframeworks_Confirmdelfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to delete this framework? This action cannot be undone.`)
};

const es_skillframeworks_confirmdelfw3 = /** @type {(inputs: Skillframeworks_Confirmdelfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres eliminar este marco? Esta acción no se puede deshacer.`)
};

const fr_skillframeworks_confirmdelfw3 = /** @type {(inputs: Skillframeworks_Confirmdelfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer ce cadre ? Cette action est irréversible.`)
};

const ar_skillframeworks_confirmdelfw3 = /** @type {(inputs: Skillframeworks_Confirmdelfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد من حذف هذا الإطار؟ لا يمكن التراجع عن هذا الإجراء.`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to delete this framework? This action cannot be undone." |
*
* @param {Skillframeworks_Confirmdelfw3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_confirmdelfw3 = /** @type {((inputs?: Skillframeworks_Confirmdelfw3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Confirmdelfw3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_confirmdelfw3(inputs)
	if (locale === "es") return es_skillframeworks_confirmdelfw3(inputs)
	if (locale === "fr") return fr_skillframeworks_confirmdelfw3(inputs)
	return ar_skillframeworks_confirmdelfw3(inputs)
});
export { skillframeworks_confirmdelfw3 as "skillFrameworks.confirmDelFw" }