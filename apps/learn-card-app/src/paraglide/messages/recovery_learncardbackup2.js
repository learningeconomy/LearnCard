/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Recovery_Learncardbackup2Inputs */

const en_recovery_learncardbackup2 = /** @type {(inputs: Recovery_Learncardbackup2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} Backup`)
};

const es_recovery_learncardbackup2 = /** @type {(inputs: Recovery_Learncardbackup2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Respaldo de ${i?.brand}`)
};

const fr_recovery_learncardbackup2 = /** @type {(inputs: Recovery_Learncardbackup2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sauvegarde ${i?.brand}`)
};

const ar_recovery_learncardbackup2 = /** @type {(inputs: Recovery_Learncardbackup2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`نسخة احتياطية من ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "{brand} Backup" |
*
* @param {Recovery_Learncardbackup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_learncardbackup2 = /** @type {((inputs: Recovery_Learncardbackup2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Learncardbackup2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_learncardbackup2(inputs)
	if (locale === "es") return es_recovery_learncardbackup2(inputs)
	if (locale === "fr") return fr_recovery_learncardbackup2(inputs)
	return ar_recovery_learncardbackup2(inputs)
});
export { recovery_learncardbackup2 as "recovery.learnCardBackup" }