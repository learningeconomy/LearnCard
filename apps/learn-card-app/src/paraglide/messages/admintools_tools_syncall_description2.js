/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Tools_Syncall_Description2Inputs */

const en_admintools_tools_syncall_description2 = /** @type {(inputs: Admintools_Tools_Syncall_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan your wallet and sync all credentials to all consented contracts based on your sharing settings.`)
};

const es_admintools_tools_syncall_description2 = /** @type {(inputs: Admintools_Tools_Syncall_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanea tu cartera y sincroniza todas las credenciales con todos los contratos consentidos según tus ajustes de uso compartido.`)
};

const fr_admintools_tools_syncall_description2 = /** @type {(inputs: Admintools_Tools_Syncall_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Analysez votre portefeuille et synchronisez tous les justificatifs avec tous les contrats consentis selon vos paramètres de partage.`)
};

const ar_admintools_tools_syncall_description2 = /** @type {(inputs: Admintools_Tools_Syncall_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`افحص محفظتك وزامن جميع بيانات الاعتماد مع جميع العقود الموافق عليها وفقًا لإعدادات المشاركة.`)
};

/**
* | output |
* | --- |
* | "Scan your wallet and sync all credentials to all consented contracts based on your sharing settings." |
*
* @param {Admintools_Tools_Syncall_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_tools_syncall_description2 = /** @type {((inputs?: Admintools_Tools_Syncall_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Tools_Syncall_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_tools_syncall_description2(inputs)
	if (locale === "es") return es_admintools_tools_syncall_description2(inputs)
	if (locale === "fr") return fr_admintools_tools_syncall_description2(inputs)
	return ar_admintools_tools_syncall_description2(inputs)
});
export { admintools_tools_syncall_description2 as "adminTools.tools.syncAll.description" }