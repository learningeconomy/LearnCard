# DidMetadataApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**didMetadataAddDidMetadata**](DidMetadataApi.md#didMetadataAddDidMetadata) | **POST** /did-metadata/create | Add Metadata to your did web |
| [**didMetadataDeleteDidMetadata**](DidMetadataApi.md#didMetadataDeleteDidMetadata) | **DELETE** /did-metadata/{id} | Delete DID Metadata |
| [**didMetadataGetDidMetadata**](DidMetadataApi.md#didMetadataGetDidMetadata) | **GET** /did-metadata/{id} | Get DID Metadata |
| [**didMetadataGetMyDidMetadata**](DidMetadataApi.md#didMetadataGetMyDidMetadata) | **POST** /profile/did-metadata | Get My DID Metadata |
| [**didMetadataUpdateDidMetadata**](DidMetadataApi.md#didMetadataUpdateDidMetadata) | **POST** /did-metadata/update/{id} | Update DID Metadata |


<a id="didMetadataAddDidMetadata"></a>
# **didMetadataAddDidMetadata**
> Boolean didMetadataAddDidMetadata(didMetadataAddDidMetadataRequest)

Add Metadata to your did web

Add Metadata to your did web

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.DidMetadataApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    DidMetadataApi apiInstance = new DidMetadataApi(defaultClient);
    DidMetadataAddDidMetadataRequest didMetadataAddDidMetadataRequest = new DidMetadataAddDidMetadataRequest(); // DidMetadataAddDidMetadataRequest | 
    try {
      Boolean result = apiInstance.didMetadataAddDidMetadata(didMetadataAddDidMetadataRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling DidMetadataApi#didMetadataAddDidMetadata");
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
| **didMetadataAddDidMetadataRequest** | [**DidMetadataAddDidMetadataRequest**](DidMetadataAddDidMetadataRequest.md)|  | |

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

<a id="didMetadataDeleteDidMetadata"></a>
# **didMetadataDeleteDidMetadata**
> Boolean didMetadataDeleteDidMetadata(id)

Delete DID Metadata

Delete DID Metadata

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.DidMetadataApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    DidMetadataApi apiInstance = new DidMetadataApi(defaultClient);
    String id = "id_example"; // String | 
    try {
      Boolean result = apiInstance.didMetadataDeleteDidMetadata(id);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling DidMetadataApi#didMetadataDeleteDidMetadata");
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
| **id** | **String**|  | |

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
| **0** | Error response |  -  |

<a id="didMetadataGetDidMetadata"></a>
# **didMetadataGetDidMetadata**
> DidMetadataGetDidMetadata200Response didMetadataGetDidMetadata(id)

Get DID Metadata

Get DID Metadata

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.DidMetadataApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    DidMetadataApi apiInstance = new DidMetadataApi(defaultClient);
    String id = "id_example"; // String | 
    try {
      DidMetadataGetDidMetadata200Response result = apiInstance.didMetadataGetDidMetadata(id);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling DidMetadataApi#didMetadataGetDidMetadata");
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
| **id** | **String**|  | |

### Return type

[**DidMetadataGetDidMetadata200Response**](DidMetadataGetDidMetadata200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="didMetadataGetMyDidMetadata"></a>
# **didMetadataGetMyDidMetadata**
> List&lt;DidMetadataGetMyDidMetadata200ResponseInner&gt; didMetadataGetMyDidMetadata()

Get My DID Metadata

Get My DID Metadata

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.DidMetadataApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    DidMetadataApi apiInstance = new DidMetadataApi(defaultClient);
    try {
      List<DidMetadataGetMyDidMetadata200ResponseInner> result = apiInstance.didMetadataGetMyDidMetadata();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling DidMetadataApi#didMetadataGetMyDidMetadata");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List&lt;DidMetadataGetMyDidMetadata200ResponseInner&gt;**](DidMetadataGetMyDidMetadata200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="didMetadataUpdateDidMetadata"></a>
# **didMetadataUpdateDidMetadata**
> Boolean didMetadataUpdateDidMetadata(id, didMetadataUpdateDidMetadataRequest)

Update DID Metadata

Update DID Metadata

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.DidMetadataApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    DidMetadataApi apiInstance = new DidMetadataApi(defaultClient);
    String id = "id_example"; // String | 
    DidMetadataUpdateDidMetadataRequest didMetadataUpdateDidMetadataRequest = new DidMetadataUpdateDidMetadataRequest(); // DidMetadataUpdateDidMetadataRequest | 
    try {
      Boolean result = apiInstance.didMetadataUpdateDidMetadata(id, didMetadataUpdateDidMetadataRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling DidMetadataApi#didMetadataUpdateDidMetadata");
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
| **id** | **String**|  | |
| **didMetadataUpdateDidMetadataRequest** | [**DidMetadataUpdateDidMetadataRequest**](DidMetadataUpdateDidMetadataRequest.md)|  | |

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

