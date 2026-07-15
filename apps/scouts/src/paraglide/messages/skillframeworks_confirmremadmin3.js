/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Confirmremadmin3Inputs */

const en_skillframeworks_confirmremadmin3 = /** @type {(inputs: Skillframeworks_Confirmremadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this admin? They will lose management access to this framework.`)
};

const es_skillframeworks_confirmremadmin3 = /** @type {(inputs: Skillframeworks_Confirmremadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres eliminar este admin? Perderá acceso de gestión a este marco.`)
};

const fr_skillframeworks_confirmremadmin3 = /** @type {(inputs: Skillframeworks_Confirmremadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir supprimer cet administrateur ? Il perdra l'accès à la gestion de ce cadre.`)
};

const ar_skillframeworks_confirmremadmin3 = /** @type {(inputs: Skillframeworks_Confirmremadmin3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this admin? They will lose management access to this framework.`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to remove this admin? They will lose management access to this framework." |
*
* @param {Skillframeworks_Confirmremadmin3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_confirmremadmin3 = /** @type {((inputs?: Skillframeworks_Confirmremadmin3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Confirmremadmin3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_confirmremadmin3(inputs)
	if (locale === "es") return es_skillframeworks_confirmremadmin3(inputs)
	if (locale === "fr") return fr_skillframeworks_confirmremadmin3(inputs)
	return ar_skillframeworks_confirmremadmin3(inputs)
});
export { skillframeworks_confirmremadmin3 as "skillFrameworks.confirmRemAdmin" }