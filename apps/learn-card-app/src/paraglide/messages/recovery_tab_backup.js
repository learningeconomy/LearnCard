/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Tab_BackupInputs */

const en_recovery_tab_backup = /** @type {(inputs: Recovery_Tab_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup`)
};

const es_recovery_tab_backup = /** @type {(inputs: Recovery_Tab_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia de seguridad`)
};

const fr_recovery_tab_backup = /** @type {(inputs: Recovery_Tab_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarde`)
};

const ar_recovery_tab_backup = /** @type {(inputs: Recovery_Tab_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخة احتياطية`)
};

/**
* | output |
* | --- |
* | "Backup" |
*
* @param {Recovery_Tab_BackupInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_tab_backup = /** @type {((inputs?: Recovery_Tab_BackupInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Tab_BackupInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_tab_backup(inputs)
	if (locale === "es") return es_recovery_tab_backup(inputs)
	if (locale === "fr") return fr_recovery_tab_backup(inputs)
	return ar_recovery_tab_backup(inputs)
});
export { recovery_tab_backup as "recovery.tab.backup" }