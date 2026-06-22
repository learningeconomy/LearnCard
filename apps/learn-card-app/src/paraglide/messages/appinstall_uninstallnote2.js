/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Uninstallnote2Inputs */

const en_appinstall_uninstallnote2 = /** @type {(inputs: Appinstall_Uninstallnote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can uninstall this app at any time from your installed apps.`)
};

const es_appinstall_uninstallnote2 = /** @type {(inputs: Appinstall_Uninstallnote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Puedes desinstalar esta aplicación en cualquier momento desde tus aplicaciones instaladas.`)
};

const fr_appinstall_uninstallnote2 = /** @type {(inputs: Appinstall_Uninstallnote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez désinstaller cette application à tout moment depuis vos applications installées.`)
};

const ar_appinstall_uninstallnote2 = /** @type {(inputs: Appinstall_Uninstallnote2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكنك إلغاء تثبيت هذا التطبيق في أي وقت من تطبيقاتك المثبّتة.`)
};

/**
* | output |
* | --- |
* | "You can uninstall this app at any time from your installed apps." |
*
* @param {Appinstall_Uninstallnote2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_uninstallnote2 = /** @type {((inputs?: Appinstall_Uninstallnote2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Uninstallnote2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_uninstallnote2(inputs)
	if (locale === "es") return es_appinstall_uninstallnote2(inputs)
	if (locale === "fr") return fr_appinstall_uninstallnote2(inputs)
	return ar_appinstall_uninstallnote2(inputs)
});
export { appinstall_uninstallnote2 as "appInstall.uninstallNote" }