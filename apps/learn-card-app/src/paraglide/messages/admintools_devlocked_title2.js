/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Devlocked_Title2Inputs */

const en_admintools_devlocked_title2 = /** @type {(inputs: Admintools_Devlocked_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer tools are limited to users with a Developer or Admin role.`)
};

const es_admintools_devlocked_title2 = /** @type {(inputs: Admintools_Devlocked_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las herramientas de desarrollador están limitadas a usuarios con rol de desarrollador o administrador.`)
};

const fr_admintools_devlocked_title2 = /** @type {(inputs: Admintools_Devlocked_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les outils pour développeurs sont réservés aux utilisateurs ayant un rôle de développeur ou d'administrateur.`)
};

const ar_admintools_devlocked_title2 = /** @type {(inputs: Admintools_Devlocked_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات المطوّر متاحة فقط للمستخدمين الذين لديهم دور مطوّر أو مسؤول.`)
};

/**
* | output |
* | --- |
* | "Developer tools are limited to users with a Developer or Admin role." |
*
* @param {Admintools_Devlocked_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_devlocked_title2 = /** @type {((inputs?: Admintools_Devlocked_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Devlocked_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_devlocked_title2(inputs)
	if (locale === "es") return es_admintools_devlocked_title2(inputs)
	if (locale === "fr") return fr_admintools_devlocked_title2(inputs)
	return ar_admintools_devlocked_title2(inputs)
});
export { admintools_devlocked_title2 as "adminTools.devLocked.title" }