/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Leaderpermissions1Inputs */

const en_troops_leaderpermissions1 = /** @type {(inputs: Troops_Leaderpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leader Permissions`)
};

const es_troops_leaderpermissions1 = /** @type {(inputs: Troops_Leaderpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos de Líder`)
};

const fr_troops_leaderpermissions1 = /** @type {(inputs: Troops_Leaderpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations de responsable`)
};

const ar_troops_leaderpermissions1 = /** @type {(inputs: Troops_Leaderpermissions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صلاحيات القائد`)
};

/**
* | output |
* | --- |
* | "Leader Permissions" |
*
* @param {Troops_Leaderpermissions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_leaderpermissions1 = /** @type {((inputs?: Troops_Leaderpermissions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Leaderpermissions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_leaderpermissions1(inputs)
	if (locale === "es") return es_troops_leaderpermissions1(inputs)
	if (locale === "fr") return fr_troops_leaderpermissions1(inputs)
	return ar_troops_leaderpermissions1(inputs)
});
export { troops_leaderpermissions1 as "troops.leaderPermissions" }