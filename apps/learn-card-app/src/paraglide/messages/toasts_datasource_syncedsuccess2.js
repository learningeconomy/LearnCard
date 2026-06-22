/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Datasource_Syncedsuccess2Inputs */

const en_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Successfully synced Data Source!`)
};

const es_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Fuente de datos sincronizada exitosamente!`)
};

const fr_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source de données synchronisée avec succès !`)
};

const ar_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم مزامنة مصدر البيانات بنجاح!`)
};

/**
* | output |
* | --- |
* | "Successfully synced Data Source!" |
*
* @param {Toasts_Datasource_Syncedsuccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_datasource_syncedsuccess2 = /** @type {((inputs?: Toasts_Datasource_Syncedsuccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Datasource_Syncedsuccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_datasource_syncedsuccess2(inputs)
	if (locale === "es") return es_toasts_datasource_syncedsuccess2(inputs)
	if (locale === "fr") return fr_toasts_datasource_syncedsuccess2(inputs)
	return ar_toasts_datasource_syncedsuccess2(inputs)
});
export { toasts_datasource_syncedsuccess2 as "toasts.dataSource.syncedSuccess" }