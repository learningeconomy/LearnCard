/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Shell_Createdproject2Inputs */

const en_developerportal_shell_createdproject2 = /** @type {(inputs: Developerportal_Shell_Createdproject2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Created "${i?.name}"`)
};

const es_developerportal_shell_createdproject2 = /** @type {(inputs: Developerportal_Shell_Createdproject2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creado "${i?.name}"`)
};

const fr_developerportal_shell_createdproject2 = /** @type {(inputs: Developerportal_Shell_Createdproject2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Créé "${i?.name}"`)
};

const ar_developerportal_shell_createdproject2 = /** @type {(inputs: Developerportal_Shell_Createdproject2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم إنشاء "${i?.name}"`)
};

/**
* | output |
* | --- |
* | "Created \"{name}\"" |
*
* @param {Developerportal_Shell_Createdproject2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_createdproject2 = /** @type {((inputs: Developerportal_Shell_Createdproject2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Createdproject2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_createdproject2(inputs)
	if (locale === "es") return es_developerportal_shell_createdproject2(inputs)
	if (locale === "fr") return fr_developerportal_shell_createdproject2(inputs)
	return ar_developerportal_shell_createdproject2(inputs)
});
export { developerportal_shell_createdproject2 as "developerPortal.shell.createdProject" }