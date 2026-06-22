/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Loading1Inputs */

const en_datasharing_loading1 = /** @type {(inputs: Datasharing_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading your data sharing...`)
};

const es_datasharing_loading1 = /** @type {(inputs: Datasharing_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando tu uso compartido de datos...`)
};

const fr_datasharing_loading1 = /** @type {(inputs: Datasharing_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement de votre partage de données...`)
};

const ar_datasharing_loading1 = /** @type {(inputs: Datasharing_Loading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ تحميل مشاركة بياناتك...`)
};

/**
* | output |
* | --- |
* | "Loading your data sharing..." |
*
* @param {Datasharing_Loading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_loading1 = /** @type {((inputs?: Datasharing_Loading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Loading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_loading1(inputs)
	if (locale === "es") return es_datasharing_loading1(inputs)
	if (locale === "fr") return fr_datasharing_loading1(inputs)
	return ar_datasharing_loading1(inputs)
});
export { datasharing_loading1 as "dataSharing.loading" }