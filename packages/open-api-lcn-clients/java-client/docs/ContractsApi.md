# ContractsApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**contractsAddAutoBoostsToContract**](ContractsApi.md#contractsAddAutoBoostsToContract) | **POST** /consent-flow-contracts/autoboosts/add | Add autoboosts to a contract |
| [**contractsConsentToContract**](ContractsApi.md#contractsConsentToContract) | **POST** /consent-flow-contract/consent | Consent To Contract |
| [**contractsCreateConsentFlowContract**](ContractsApi.md#contractsCreateConsentFlowContract) | **POST** /consent-flow-contract | Create Consent Flow Contract |
| [**contractsDeleteConsentFlowContract**](ContractsApi.md#contractsDeleteConsentFlowContract) | **DELETE** /consent-flow-contract | Delete a Consent Flow Contract |
| [**contractsGetAllCredentialsForTerms**](ContractsApi.md#contractsGetAllCredentialsForTerms) | **POST** /consent-flow-contracts/credentials | Get all credentials written to any terms |
| [**contractsGetConsentFlowContract**](ContractsApi.md#contractsGetConsentFlowContract) | **GET** /consent-flow-contract | Get Consent Flow Contracts |
| [**contractsGetConsentFlowContracts**](ContractsApi.md#contractsGetConsentFlowContracts) | **POST** /consent-flow-contracts | Get Consent Flow Contracts |
| [**contractsGetConsentedContracts**](ContractsApi.md#contractsGetConsentedContracts) | **POST** /consent-flow-contracts/consent | Gets Consented Contracts |
| [**contractsGetConsentedData**](ContractsApi.md#contractsGetConsentedData) | **POST** /consent-flow-contract/data | Get the data that has been consented for all of your contracts |
| [**contractsGetConsentedDataForContract**](ContractsApi.md#contractsGetConsentedDataForContract) | **POST** /consent-flow-contract/data-for-contract | Get the data that has been consented for a contract |
| [**contractsGetConsentedDataForDid**](ContractsApi.md#contractsGetConsentedDataForDid) | **POST** /consent-flow-contract/data-for-did | Get the data that has been consented by a did |
| [**contractsGetCredentialsForContract**](ContractsApi.md#contractsGetCredentialsForContract) | **POST** /consent-flow-contract/credentials | Get credentials issued via a contract |
| [**contractsGetTermsTransactionHistory**](ContractsApi.md#contractsGetTermsTransactionHistory) | **POST** /consent-flow-contract/consent/history | Gets Transaction History |
| [**contractsRemoveAutoBoostsFromContract**](ContractsApi.md#contractsRemoveAutoBoostsFromContract) | **POST** /consent-flow-contracts/autoboosts/remove | Remove autoboosts from a contract |
| [**contractsSyncCredentialsToContract**](ContractsApi.md#contractsSyncCredentialsToContract) | **POST** /consent-flow-contract/sync | Sync credentials to a contract |
| [**contractsUpdateConsentedContractTerms**](ContractsApi.md#contractsUpdateConsentedContractTerms) | **POST** /consent-flow-contract/consent/update | Updates Contract Terms |
| [**contractsVerifyConsent**](ContractsApi.md#contractsVerifyConsent) | **GET** /consent-flow-contract/verify | Verifies that a profile has consented to a contract |
| [**contractsWithdrawConsent**](ContractsApi.md#contractsWithdrawConsent) | **DELETE** /consent-flow-contract/consent/withdraw | Deletes Contract Terms |
| [**contractsWriteCredentialToContract**](ContractsApi.md#contractsWriteCredentialToContract) | **POST** /consent-flow-contract/write | Writes a boost credential to a did that has consented to a contract |
| [**contractsWriteCredentialToContractViaSigningAuthority**](ContractsApi.md#contractsWriteCredentialToContractViaSigningAuthority) | **POST** /consent-flow-contract/write/via-signing-authority | Write credential through signing authority for a DID consented to a contract |


<a id="contractsAddAutoBoostsToContract"></a>
# **contractsAddAutoBoostsToContract**
> Boolean contractsAddAutoBoostsToContract(contractsAddAutoBoostsToContractRequest)

Add autoboosts to a contract

Adds one or more autoboost configurations to an existing consent flow contract. The caller must be the contract owner or a designated writer. The signing authority for each autoboost must be registered to the caller.

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsAddAutoBoostsToContractRequest contractsAddAutoBoostsToContractRequest = new ContractsAddAutoBoostsToContractRequest(); // ContractsAddAutoBoostsToContractRequest | 
    try {
      Boolean result = apiInstance.contractsAddAutoBoostsToContract(contractsAddAutoBoostsToContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsAddAutoBoostsToContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsAddAutoBoostsToContractRequest** | [**ContractsAddAutoBoostsToContractRequest**](ContractsAddAutoBoostsToContractRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsConsentToContract"></a>
# **contractsConsentToContract**
> String contractsConsentToContract(contractsConsentToContractRequest)

Consent To Contract

Consents to a Contract with a hard set of terms

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsConsentToContractRequest contractsConsentToContractRequest = new ContractsConsentToContractRequest(); // ContractsConsentToContractRequest | 
    try {
      String result = apiInstance.contractsConsentToContract(contractsConsentToContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsConsentToContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsConsentToContractRequest** | [**ContractsConsentToContractRequest**](ContractsConsentToContractRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsCreateConsentFlowContract"></a>
# **contractsCreateConsentFlowContract**
> String contractsCreateConsentFlowContract(contractsCreateConsentFlowContractRequest)

Create Consent Flow Contract

Creates a Consent Flow Contract for a profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsCreateConsentFlowContractRequest contractsCreateConsentFlowContractRequest = new ContractsCreateConsentFlowContractRequest(); // ContractsCreateConsentFlowContractRequest | 
    try {
      String result = apiInstance.contractsCreateConsentFlowContract(contractsCreateConsentFlowContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsCreateConsentFlowContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsCreateConsentFlowContractRequest** | [**ContractsCreateConsentFlowContractRequest**](ContractsCreateConsentFlowContractRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsDeleteConsentFlowContract"></a>
# **contractsDeleteConsentFlowContract**
> Boolean contractsDeleteConsentFlowContract(uri)

Delete a Consent Flow Contract

This route deletes a Consent Flow Contract

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      Boolean result = apiInstance.contractsDeleteConsentFlowContract(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsDeleteConsentFlowContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetAllCredentialsForTerms"></a>
# **contractsGetAllCredentialsForTerms**
> ContractsGetCredentialsForContract200Response contractsGetAllCredentialsForTerms(contractsGetAllCredentialsForTermsRequest)

Get all credentials written to any terms

Gets all credentials that were written to any terms owned by this profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetAllCredentialsForTermsRequest contractsGetAllCredentialsForTermsRequest = new ContractsGetAllCredentialsForTermsRequest(); // ContractsGetAllCredentialsForTermsRequest | 
    try {
      ContractsGetCredentialsForContract200Response result = apiInstance.contractsGetAllCredentialsForTerms(contractsGetAllCredentialsForTermsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetAllCredentialsForTerms");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetAllCredentialsForTermsRequest** | [**ContractsGetAllCredentialsForTermsRequest**](ContractsGetAllCredentialsForTermsRequest.md)|  | [optional] |

### Return type

[**ContractsGetCredentialsForContract200Response**](ContractsGetCredentialsForContract200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetConsentFlowContract"></a>
# **contractsGetConsentFlowContract**
> ContractsGetConsentFlowContract200Response contractsGetConsentFlowContract(uri)

Get Consent Flow Contracts

Gets Consent Flow Contract Details

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      ContractsGetConsentFlowContract200Response result = apiInstance.contractsGetConsentFlowContract(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetConsentFlowContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

[**ContractsGetConsentFlowContract200Response**](ContractsGetConsentFlowContract200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetConsentFlowContracts"></a>
# **contractsGetConsentFlowContracts**
> ContractsGetConsentFlowContracts200Response contractsGetConsentFlowContracts(contractsGetConsentFlowContractsRequest)

Get Consent Flow Contracts

Gets Consent Flow Contracts for a profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetConsentFlowContractsRequest contractsGetConsentFlowContractsRequest = new ContractsGetConsentFlowContractsRequest(); // ContractsGetConsentFlowContractsRequest | 
    try {
      ContractsGetConsentFlowContracts200Response result = apiInstance.contractsGetConsentFlowContracts(contractsGetConsentFlowContractsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetConsentFlowContracts");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetConsentFlowContractsRequest** | [**ContractsGetConsentFlowContractsRequest**](ContractsGetConsentFlowContractsRequest.md)|  | [optional] |

### Return type

[**ContractsGetConsentFlowContracts200Response**](ContractsGetConsentFlowContracts200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetConsentedContracts"></a>
# **contractsGetConsentedContracts**
> ContractsGetConsentedContracts200Response contractsGetConsentedContracts(contractsGetConsentedContractsRequest)

Gets Consented Contracts

Gets all consented contracts for a user

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetConsentedContractsRequest contractsGetConsentedContractsRequest = new ContractsGetConsentedContractsRequest(); // ContractsGetConsentedContractsRequest | 
    try {
      ContractsGetConsentedContracts200Response result = apiInstance.contractsGetConsentedContracts(contractsGetConsentedContractsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetConsentedContracts");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetConsentedContractsRequest** | [**ContractsGetConsentedContractsRequest**](ContractsGetConsentedContractsRequest.md)|  | [optional] |

### Return type

[**ContractsGetConsentedContracts200Response**](ContractsGetConsentedContracts200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetConsentedData"></a>
# **contractsGetConsentedData**
> ContractsGetConsentedDataForContract200Response contractsGetConsentedData(contractsGetConsentedDataRequest)

Get the data that has been consented for all of your contracts

This route grabs all the data that has been consented for all of your contracts

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetConsentedDataRequest contractsGetConsentedDataRequest = new ContractsGetConsentedDataRequest(); // ContractsGetConsentedDataRequest | 
    try {
      ContractsGetConsentedDataForContract200Response result = apiInstance.contractsGetConsentedData(contractsGetConsentedDataRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetConsentedData");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetConsentedDataRequest** | [**ContractsGetConsentedDataRequest**](ContractsGetConsentedDataRequest.md)|  | [optional] |

### Return type

[**ContractsGetConsentedDataForContract200Response**](ContractsGetConsentedDataForContract200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetConsentedDataForContract"></a>
# **contractsGetConsentedDataForContract**
> ContractsGetConsentedDataForContract200Response contractsGetConsentedDataForContract(contractsGetConsentedDataForContractRequest)

Get the data that has been consented for a contract

This route grabs all the data that has been consented for a contract

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetConsentedDataForContractRequest contractsGetConsentedDataForContractRequest = new ContractsGetConsentedDataForContractRequest(); // ContractsGetConsentedDataForContractRequest | 
    try {
      ContractsGetConsentedDataForContract200Response result = apiInstance.contractsGetConsentedDataForContract(contractsGetConsentedDataForContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetConsentedDataForContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetConsentedDataForContractRequest** | [**ContractsGetConsentedDataForContractRequest**](ContractsGetConsentedDataForContractRequest.md)|  | |

### Return type

[**ContractsGetConsentedDataForContract200Response**](ContractsGetConsentedDataForContract200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetConsentedDataForDid"></a>
# **contractsGetConsentedDataForDid**
> ContractsGetConsentedDataForDid200Response contractsGetConsentedDataForDid(contractsGetConsentedDataForDidRequest)

Get the data that has been consented by a did

This route grabs all the data that has been consented by a did

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetConsentedDataForDidRequest contractsGetConsentedDataForDidRequest = new ContractsGetConsentedDataForDidRequest(); // ContractsGetConsentedDataForDidRequest | 
    try {
      ContractsGetConsentedDataForDid200Response result = apiInstance.contractsGetConsentedDataForDid(contractsGetConsentedDataForDidRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetConsentedDataForDid");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetConsentedDataForDidRequest** | [**ContractsGetConsentedDataForDidRequest**](ContractsGetConsentedDataForDidRequest.md)|  | |

### Return type

[**ContractsGetConsentedDataForDid200Response**](ContractsGetConsentedDataForDid200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetCredentialsForContract"></a>
# **contractsGetCredentialsForContract**
> ContractsGetCredentialsForContract200Response contractsGetCredentialsForContract(contractsGetCredentialsForContractRequest)

Get credentials issued via a contract

Gets all credentials that were issued via a contract

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetCredentialsForContractRequest contractsGetCredentialsForContractRequest = new ContractsGetCredentialsForContractRequest(); // ContractsGetCredentialsForContractRequest | 
    try {
      ContractsGetCredentialsForContract200Response result = apiInstance.contractsGetCredentialsForContract(contractsGetCredentialsForContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetCredentialsForContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetCredentialsForContractRequest** | [**ContractsGetCredentialsForContractRequest**](ContractsGetCredentialsForContractRequest.md)|  | |

### Return type

[**ContractsGetCredentialsForContract200Response**](ContractsGetCredentialsForContract200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsGetTermsTransactionHistory"></a>
# **contractsGetTermsTransactionHistory**
> ContractsGetTermsTransactionHistory200Response contractsGetTermsTransactionHistory(contractsGetTermsTransactionHistoryRequest)

Gets Transaction History

Gets the transaction history for a set of Consent Flow Contract Terms

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsGetTermsTransactionHistoryRequest contractsGetTermsTransactionHistoryRequest = new ContractsGetTermsTransactionHistoryRequest(); // ContractsGetTermsTransactionHistoryRequest | 
    try {
      ContractsGetTermsTransactionHistory200Response result = apiInstance.contractsGetTermsTransactionHistory(contractsGetTermsTransactionHistoryRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsGetTermsTransactionHistory");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsGetTermsTransactionHistoryRequest** | [**ContractsGetTermsTransactionHistoryRequest**](ContractsGetTermsTransactionHistoryRequest.md)|  | |

### Return type

[**ContractsGetTermsTransactionHistory200Response**](ContractsGetTermsTransactionHistory200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsRemoveAutoBoostsFromContract"></a>
# **contractsRemoveAutoBoostsFromContract**
> Boolean contractsRemoveAutoBoostsFromContract(contractsRemoveAutoBoostsFromContractRequest)

Remove autoboosts from a contract

Removes one or more autoboosts from an existing consent flow contract, identified by their boost URIs. The caller must be the contract owner or a designated writer.

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsRemoveAutoBoostsFromContractRequest contractsRemoveAutoBoostsFromContractRequest = new ContractsRemoveAutoBoostsFromContractRequest(); // ContractsRemoveAutoBoostsFromContractRequest | 
    try {
      Boolean result = apiInstance.contractsRemoveAutoBoostsFromContract(contractsRemoveAutoBoostsFromContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsRemoveAutoBoostsFromContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsRemoveAutoBoostsFromContractRequest** | [**ContractsRemoveAutoBoostsFromContractRequest**](ContractsRemoveAutoBoostsFromContractRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsSyncCredentialsToContract"></a>
# **contractsSyncCredentialsToContract**
> Boolean contractsSyncCredentialsToContract(contractsSyncCredentialsToContractRequest)

Sync credentials to a contract

Syncs credentials to a contract that the profile has consented to

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsSyncCredentialsToContractRequest contractsSyncCredentialsToContractRequest = new ContractsSyncCredentialsToContractRequest(); // ContractsSyncCredentialsToContractRequest | 
    try {
      Boolean result = apiInstance.contractsSyncCredentialsToContract(contractsSyncCredentialsToContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsSyncCredentialsToContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsSyncCredentialsToContractRequest** | [**ContractsSyncCredentialsToContractRequest**](ContractsSyncCredentialsToContractRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsUpdateConsentedContractTerms"></a>
# **contractsUpdateConsentedContractTerms**
> Boolean contractsUpdateConsentedContractTerms(contractsUpdateConsentedContractTermsRequest)

Updates Contract Terms

Updates the terms for a consented contract

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsUpdateConsentedContractTermsRequest contractsUpdateConsentedContractTermsRequest = new ContractsUpdateConsentedContractTermsRequest(); // ContractsUpdateConsentedContractTermsRequest | 
    try {
      Boolean result = apiInstance.contractsUpdateConsentedContractTerms(contractsUpdateConsentedContractTermsRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsUpdateConsentedContractTerms");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsUpdateConsentedContractTermsRequest** | [**ContractsUpdateConsentedContractTermsRequest**](ContractsUpdateConsentedContractTermsRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsVerifyConsent"></a>
# **contractsVerifyConsent**
> Boolean contractsVerifyConsent(uri, profileId)

Verifies that a profile has consented to a contract

Checks if a profile has consented to the specified contract

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    String uri = "uri_example"; // String | 
    String profileId = "profileId_example"; // String | 
    try {
      Boolean result = apiInstance.contractsVerifyConsent(uri, profileId);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsVerifyConsent");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |
| **profileId** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="contractsWithdrawConsent"></a>
# **contractsWithdrawConsent**
> Boolean contractsWithdrawConsent(uri)

Deletes Contract Terms

Withdraws consent by deleting Contract Terms

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      Boolean result = apiInstance.contractsWithdrawConsent(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsWithdrawConsent");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **404** | Not found |  -  |
| **500** | Internal server error |  -  |

<a id="contractsWriteCredentialToContract"></a>
# **contractsWriteCredentialToContract**
> String contractsWriteCredentialToContract(contractsWriteCredentialToContractRequest)

Writes a boost credential to a did that has consented to a contract

Writes a boost credential to a did that has consented to a contract

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsWriteCredentialToContractRequest contractsWriteCredentialToContractRequest = new ContractsWriteCredentialToContractRequest(); // ContractsWriteCredentialToContractRequest | 
    try {
      String result = apiInstance.contractsWriteCredentialToContract(contractsWriteCredentialToContractRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsWriteCredentialToContract");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsWriteCredentialToContractRequest** | [**ContractsWriteCredentialToContractRequest**](ContractsWriteCredentialToContractRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

<a id="contractsWriteCredentialToContractViaSigningAuthority"></a>
# **contractsWriteCredentialToContractViaSigningAuthority**
> String contractsWriteCredentialToContractViaSigningAuthority(contractsWriteCredentialToContractViaSigningAuthorityRequest)

Write credential through signing authority for a DID consented to a contract

Issues and sends a boost credential via a registered signing authority to a DID that has consented to a contract.

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ContractsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ContractsApi apiInstance = new ContractsApi(defaultClient);
    ContractsWriteCredentialToContractViaSigningAuthorityRequest contractsWriteCredentialToContractViaSigningAuthorityRequest = new ContractsWriteCredentialToContractViaSigningAuthorityRequest(); // ContractsWriteCredentialToContractViaSigningAuthorityRequest | 
    try {
      String result = apiInstance.contractsWriteCredentialToContractViaSigningAuthority(contractsWriteCredentialToContractViaSigningAuthorityRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ContractsApi#contractsWriteCredentialToContractViaSigningAuthority");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **contractsWriteCredentialToContractViaSigningAuthorityRequest** | [**ContractsWriteCredentialToContractViaSigningAuthorityRequest**](ContractsWriteCredentialToContractViaSigningAuthorityRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **400** | Invalid input data |  -  |
| **401** | Authorization not provided |  -  |
| **403** | Insufficient access |  -  |
| **500** | Internal server error |  -  |

