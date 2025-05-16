# StorageApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**storageResolve**](StorageApi.md#storageResolve) | **GET** /storage/resolve | Resolves a URI to a Credential/Presentation |
| [**storageStore**](StorageApi.md#storageStore) | **POST** /storage/store | Store a Credential/Presentation |


<a id="storageResolve"></a>
# **storageResolve**
> StorageResolve200Response storageResolve(uri)

Resolves a URI to a Credential/Presentation

This endpoint stores a credential/presentation, returning a uri that can be used to resolve it

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.models.*;
import org.openapitools.client.api.StorageApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");

    StorageApi apiInstance = new StorageApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      StorageResolve200Response result = apiInstance.storageResolve(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling StorageApi#storageResolve");
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

[**StorageResolve200Response**](StorageResolve200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="storageStore"></a>
# **storageStore**
> String storageStore(storageStoreRequest)

Store a Credential/Presentation

This endpoint stores a credential/presentation, returning a uri that can be used to resolve it

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.StorageApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    StorageApi apiInstance = new StorageApi(defaultClient);
    StorageStoreRequest storageStoreRequest = new StorageStoreRequest(); // StorageStoreRequest | 
    try {
      String result = apiInstance.storageStore(storageStoreRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling StorageApi#storageStore");
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
| **storageStoreRequest** | [**StorageStoreRequest**](StorageStoreRequest.md)|  | |

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

