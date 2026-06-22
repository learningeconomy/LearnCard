/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Datatrust_Emptystatus2Inputs */

const en_dashboard_datatrust_emptystatus2 = /** @type {(inputs: Dashboard_Datatrust_Emptystatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nothing is shared yet.`)
};

const es_dashboard_datatrust_emptystatus2 = /** @type {(inputs: Dashboard_Datatrust_Emptystatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no compartes nada.`)
};

const fr_dashboard_datatrust_emptystatus2 = /** @type {(inputs: Dashboard_Datatrust_Emptystatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rien n'est encore partagé.`)
};

const ar_dashboard_datatrust_emptystatus2 = /** @type {(inputs: Dashboard_Datatrust_Emptystatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم مشاركة أي شيء بعد.`)
};

/**
* | output |
* | --- |
* | "Nothing is shared yet." |
*
* @param {Dashboard_Datatrust_Emptystatus2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_datatrust_emptystatus2 = /** @type {((inputs?: Dashboard_Datatrust_Emptystatus2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Datatrust_Emptystatus2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_datatrust_emptystatus2(inputs)
	if (locale === "es") return es_dashboard_datatrust_emptystatus2(inputs)
	if (locale === "fr") return fr_dashboard_datatrust_emptystatus2(inputs)
	return ar_dashboard_datatrust_emptystatus2(inputs)
});
export { dashboard_datatrust_emptystatus2 as "dashboard.dataTrust.emptyStatus" }