# UtilitiesApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**utilitiesGetChallenges**](UtilitiesApi.md#utilitiesGetChallenges) | **GET** /challenges | Request a list of valid challenges |
| [**utilitiesGetDid**](UtilitiesApi.md#utilitiesGetDid) | **GET** /did | Get LCN Did |
| [**utilitiesHealthCheck**](UtilitiesApi.md#utilitiesHealthCheck) | **GET** /health-check | Check health of endpoint |


<a id="utilitiesGetChallenges"></a>
# **utilitiesGetChallenges**
> List&lt;String&gt; utilitiesGetChallenges(amount)

Request a list of valid challenges

Generates an arbitrary number of valid challenges for a did, then returns them

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.UtilitiesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    UtilitiesApi apiInstance = new UtilitiesApi(defaultClient);
    Integer amount = 100; // Integer | 
    try {
      List<String> result = apiInstance.utilitiesGetChallenges(amount);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling UtilitiesApi#utilitiesGetChallenges");
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
| **amount** | **Integer**|  | [optional] [default to 100] |

### Return type

**List&lt;String&gt;**

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

<a id="utilitiesGetDid"></a>
# **utilitiesGetDid**
> String utilitiesGetDid()

Get LCN Did

Gets the did:web for the LCN itself

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.UtilitiesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    UtilitiesApi apiInstance = new UtilitiesApi(defaultClient);
    try {
      String result = apiInstance.utilitiesGetDid();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling UtilitiesApi#utilitiesGetDid");
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

**String**

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

<a id="utilitiesHealthCheck"></a>
# **utilitiesHealthCheck**
> String utilitiesHealthCheck()

Check health of endpoint

Check if the endpoint is healthy and well

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.models.*;
import org.openapitools.client.api.UtilitiesApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");

    UtilitiesApi apiInstance = new UtilitiesApi(defaultClient);
    try {
      String result = apiInstance.utilitiesHealthCheck();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling UtilitiesApi#utilitiesHealthCheck");
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

**String**

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

