/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backup_Taptochoose2Inputs */

const en_recovery_backup_taptochoose2 = /** @type {(inputs: Recovery_Backup_Taptochoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tap to choose backup file`)
};

const es_recovery_backup_taptochoose2 = /** @type {(inputs: Recovery_Backup_Taptochoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toca para elegir archivo de respaldo`)
};

const fr_recovery_backup_taptochoose2 = /** @type {(inputs: Recovery_Backup_Taptochoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appuyez pour choisir le fichier de sauvegarde`)
};

const ar_recovery_backup_taptochoose2 = /** @type {(inputs: Recovery_Backup_Taptochoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اضغط لاختيار ملف النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Tap to choose backup file" |
*
* @param {Recovery_Backup_Taptochoose2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backup_taptochoose2 = /** @type {((inputs?: Recovery_Backup_Taptochoose2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backup_Taptochoose2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backup_taptochoose2(inputs)
	if (locale === "es") return es_recovery_backup_taptochoose2(inputs)
	if (locale === "fr") return fr_recovery_backup_taptochoose2(inputs)
	return ar_recovery_backup_taptochoose2(inputs)
});
export { recovery_backup_taptochoose2 as "recovery.backup.tapToChoose" }