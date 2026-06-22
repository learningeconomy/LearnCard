/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Install1Inputs */

const en_appinstall_install1 = /** @type {(inputs: Appinstall_Install1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install`)
};

const es_appinstall_install1 = /** @type {(inputs: Appinstall_Install1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instalar`)
};

const fr_appinstall_install1 = /** @type {(inputs: Appinstall_Install1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installer`)
};

const ar_appinstall_install1 = /** @type {(inputs: Appinstall_Install1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تثبيت`)
};

/**
* | output |
* | --- |
* | "Install" |
*
* @param {Appinstall_Install1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_install1 = /** @type {((inputs?: Appinstall_Install1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Install1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_install1(inputs)
	if (locale === "es") return es_appinstall_install1(inputs)
	if (locale === "fr") return fr_appinstall_install1(inputs)
	return ar_appinstall_install1(inputs)
});
export { appinstall_install1 as "appInstall.install" }