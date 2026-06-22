/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backupdescription1Inputs */

const en_recovery_backupdescription1 = /** @type {(inputs: Recovery_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate an encrypted backup file protected by a password. Store it somewhere safe — you'll need both the file and the password to recover.`)
};

const es_recovery_backupdescription1 = /** @type {(inputs: Recovery_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genera un archivo de copia de seguridad cifrado protegido por una contraseña. Guárdalo en un lugar seguro — necesitarás tanto el archivo como la contraseña para recuperar.`)
};

const fr_recovery_backupdescription1 = /** @type {(inputs: Recovery_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générez un fichier de sauvegarde chiffré protégé par un mot de passe. Stockez-le en lieu sûr — vous aurez besoin du fichier et du mot de passe pour récupérer.`)
};

const ar_recovery_backupdescription1 = /** @type {(inputs: Recovery_Backupdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ ملف نسخة احتياطية مشفر محمي بكلمة مرور. احفظه في مكان آمن — ستحتاج إلى الملف وكلمة المرور للاسترداد.`)
};

/**
* | output |
* | --- |
* | "Generate an encrypted backup file protected by a password. Store it somewhere safe — you'll need both the file and the password to recover." |
*
* @param {Recovery_Backupdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backupdescription1 = /** @type {((inputs?: Recovery_Backupdescription1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backupdescription1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backupdescription1(inputs)
	if (locale === "es") return es_recovery_backupdescription1(inputs)
	if (locale === "fr") return fr_recovery_backupdescription1(inputs)
	return ar_recovery_backupdescription1(inputs)
});
export { recovery_backupdescription1 as "recovery.backupDescription" }