# ClaimHooksApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**claimHookCreateClaimHook**](ClaimHooksApi.md#claimHookCreateClaimHook) | **POST** /claim-hook/create | Creates a claim hook |
| [**claimHookDeleteClaimHook**](ClaimHooksApi.md#claimHookDeleteClaimHook) | **POST** /claim-hook/update | Delete a Claim Hook |
| [**claimHookGetClaimHooksForBoost**](ClaimHooksApi.md#claimHookGetClaimHooksForBoost) | **POST** /claim-hook/get | Gets Claim Hooks |


<a id="claimHookCreateClaimHook"></a>
# **claimHookCreateClaimHook**
> String claimHookCreateClaimHook(claimHookCreateClaimHookRequest)

Creates a claim hook

This route creates a claim hook. Claim hooks are an atomic action that will be performed when a boost is claimed

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ClaimHooksApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ClaimHooksApi apiInstance = new ClaimHooksApi(defaultClient);
    ClaimHookCreateClaimHookRequest claimHookCreateClaimHookRequest = new ClaimHookCreateClaimHookRequest(); // ClaimHookCreateClaimHookRequest | 
    try {
      String result = apiInstance.claimHookCreateClaimHook(claimHookCreateClaimHookRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ClaimHooksApi#claimHookCreateClaimHook");
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
| **claimHookCreateClaimHookRequest** | [**ClaimHookCreateClaimHookRequest**](ClaimHookCreateClaimHookRequest.md)|  | |

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
| **0** | Error response |  -  |

<a id="claimHookDeleteClaimHook"></a>
# **claimHookDeleteClaimHook**
> Boolean claimHookDeleteClaimHook(claimHookDeleteClaimHookRequest)

Delete a Claim Hook

This route deletes a claim hook

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ClaimHooksApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ClaimHooksApi apiInstance = new ClaimHooksApi(defaultClient);
    ClaimHookDeleteClaimHookRequest claimHookDeleteClaimHookRequest = new ClaimHookDeleteClaimHookRequest(); // ClaimHookDeleteClaimHookRequest | 
    try {
      Boolean result = apiInstance.claimHookDeleteClaimHook(claimHookDeleteClaimHookRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ClaimHooksApi#claimHookDeleteClaimHook");
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
| **claimHookDeleteClaimHookRequest** | [**ClaimHookDeleteClaimHookRequest**](ClaimHookDeleteClaimHookRequest.md)|  | |

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
| **0** | Error response |  -  |

<a id="claimHookGetClaimHooksForBoost"></a>
# **claimHookGetClaimHooksForBoost**
> ClaimHookGetClaimHooksForBoost200Response claimHookGetClaimHooksForBoost(claimHookGetClaimHooksForBoostRequest)

Gets Claim Hooks

This route gets claim hooks attached to a given boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ClaimHooksApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ClaimHooksApi apiInstance = new ClaimHooksApi(defaultClient);
    ClaimHookGetClaimHooksForBoostRequest claimHookGetClaimHooksForBoostRequest = new ClaimHookGetClaimHooksForBoostRequest(); // ClaimHookGetClaimHooksForBoostRequest | 
    try {
      ClaimHookGetClaimHooksForBoost200Response result = apiInstance.claimHookGetClaimHooksForBoost(claimHookGetClaimHooksForBoostRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ClaimHooksApi#claimHookGetClaimHooksForBoost");
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
| **claimHookGetClaimHooksForBoostRequest** | [**ClaimHookGetClaimHooksForBoostRequest**](ClaimHookGetClaimHooksForBoostRequest.md)|  | |

### Return type

[**ClaimHookGetClaimHooksForBoost200Response**](ClaimHookGetClaimHooksForBoost200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

