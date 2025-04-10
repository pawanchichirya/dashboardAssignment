import { useState, useEffect, ChangeEvent } from 'react';
import { Container, Row, Col, Card, Form, Alert, Spinner } from 'react-bootstrap';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';

interface DashboardData {
  totalSales: number;
  quantitySold: number;
  discountPercentage: number;
  totalProfit: number;
  salesByCity: { [key: string]: number };
  salesByProducts: Array<{ name: string; sales: number }>;
  salesByCategory: { [key: string]: number };
  salesBySubCategory: Array<{ name: string; value: number }>;
  salesBySegment: { [key: string]: number };
}

interface DateRange {
  from: string;
  to: string;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState('All States');
  const [states, setStates] = useState<string[]>(['All States']);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: '2014-01-01',
    to: '2017-12-31'
  });

  // Fetch available states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/states');
        setStates(['All States', ...response.data]);
      } catch (error) {
        console.error('Error fetching states:', error);
        setError('Failed to fetch states. Please try again later.');
      }
    };

    fetchStates();
  }, []);

  // Fetch date range when state changes
  useEffect(() => {
    const fetchDateRange = async () => {
      if (selectedState === 'All States') {
        return;
      }
      try {
        const response = await axios.get(`http://localhost:3001/api/dateRange/${selectedState}`);
        setDateRange({
          from: response.data.minDate,
          to: response.data.maxDate
        });
      } catch (error) {
        console.error('Error fetching date range:', error);
      }
    };

    fetchDateRange();
  }, [selectedState]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('http://localhost:3001/api/dashboard', {
          params: {
            state: selectedState,
            startDate: dateRange.from,
            endDate: dateRange.to
          }
        });
        console.log('Dashboard data:', response.data);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedState, dateRange]);

  if (loading) {
    return (
      <Container fluid className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger">
          {error}
        </Alert>
      </Container>
    );
  }

  const cityChartOption = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        return `${params[0].name}: $${params[0].value.toLocaleString()}`;
      }
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: { 
        color: '#666666',
        formatter: (value: number) => `$${value.toLocaleString()}`
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.05)',
          type: 'dashed'
        }
      },
      axisLine: {
        show: false
      }
    },
    yAxis: {
      type: 'category',
      data: data ? Object.entries(data.salesByCity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([city]) => city) : [],
      axisLabel: { 
        color: '#666666',
        margin: 20,
        fontSize: 12
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      }
    },
    series: [
      {
        name: 'Sales',
        type: 'bar',
        data: data ? Object.entries(data.salesByCity)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([, sales]) => sales) : [],
        itemStyle: {
          color: '#87CEEB',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '40%'
      }
    ]
  };

  const categoryChartOption = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#666666' }
    },
    series: [
      {
        name: 'Sales by Category',
        type: 'pie',
        radius: ['40%', '70%'],
        data: data ? Object.entries(data.salesByCategory).map(([name, value]) => ({
          name,
          value
        })) : [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    ]
  };

  const productsChartOption = {
    backgroundColor: '#ffffff',
    tooltip: {
      show: false
    },
    grid: {
      left: '25%',
      right: '15%',
      bottom: '3%',
      top: '40px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      show: false,
      max: function(value: { max: number }) {
        return value.max * 1.2;
      }
    },
    yAxis: {
      type: 'category',
      data: data ? data.salesByProducts
        .slice(0, 10)
        .map(product => product.name) : [],
      axisLabel: { 
        color: '#333333',
        margin: 20,
        fontSize: 12,
        width: 300,
        overflow: 'truncate',
        fontWeight: 'normal'
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      }
    },
    series: [
      {
        name: 'Background',
        type: 'bar',
        barWidth: '80%',
        silent: true,
        z: 1,
        data: data ? data.salesByProducts
          .slice(0, 10)
          .map(product => ({
            value: (data.salesByProducts[0].sales * 1.2),
            itemStyle: {
              color: 'rgba(135, 206, 235, 0.2)',
              borderRadius: [4, 4, 4, 4]
            }
          })) : [],
      },
      {
        name: 'Sales',
        type: 'bar',
        barWidth: '80%',
        z: 2,
        data: data ? data.salesByProducts
          .slice(0, 10)
          .map(product => ({
            value: product.sales,
            itemStyle: {
              color: '#1e88e5',
              borderRadius: [4, 4, 4, 4]
            }
          })) : [],
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            const product = data?.salesByProducts[params.dataIndex];
            return `$${product?.sales.toLocaleString()}`;
          },
          fontSize: 12,
          color: '#333333',
          fontWeight: 'normal'
        }
      }
    ],
    title: [
      {
        text: 'Product Name',
        left: '25%',
        top: '10px',
        textStyle: {
          color: '#333333',
          fontSize: 12,
          fontWeight: 'bold'
        }
      },
      {
        text: 'Sales in $',
        right: '15%',
        top: '10px',
        textStyle: {
          color: '#333333',
          fontSize: 12,
          fontWeight: 'bold'
        }
      }
    ]
  };

  const subCategoryChartOption = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        return `${params[0].name}: $${params[0].value.toLocaleString()}`;
      }
    },
    grid: {
      left: '15%',
      right: '5%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: { 
        color: '#666666',
        formatter: (value: number) => `$${value.toLocaleString()}`
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.05)',
          type: 'dashed'
        }
      },
      axisLine: {
        show: false
      }
    },
    yAxis: {
      type: 'category',
      data: data ? data.salesBySubCategory
        .slice(0, 8)
        .map(item => item.name) : [],
      axisLabel: { 
        color: '#666666',
        margin: 20,
        fontSize: 12
      },
      axisTick: {
        show: false
      },
      axisLine: {
        show: false
      }
    },
    series: [
      {
        name: 'Sales',
        type: 'bar',
        data: data ? data.salesBySubCategory
          .slice(0, 8)
          .map(item => ({
            value: item.value,
            itemStyle: {
              color: '#87CEEB',
              borderRadius: [0, 4, 4, 0]
            }
          })) : [],
        itemStyle: {
          color: '#87CEEB',
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '40%',
        label: {
          show: true, // Show the label
          position: 'inside', // Position the label inside the bar
          formatter: (params: any) => {
            return `$${params.value.toLocaleString()}`; // Format the value
          },
          fontSize: 12,
          color: '#ffffff', // Change color for better visibility
          fontWeight: 'bold'
        }
      }
    ]
  };

  const segmentChartOption = {
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#666666' }
    },
    series: [
      {
        name: 'Sales by Segment',
        type: 'pie',
        radius: ['40%', '70%'],
        data: data ? Object.entries(data.salesBySegment).map(([name, value]) => ({
          name,
          value
        })) : [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    ]
  };

  return (
    <Container fluid>
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Form.Select
            className="dropdown-dark w-100"
            value={selectedState}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedState(e.target.value)}
          >
            <option>All States</option>
            {states.map((state: string) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Control
            type="date"
            className="dropdown-dark w-100"
            value={dateRange.from}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setDateRange((prev: DateRange) => ({ ...prev, from: e.target.value }))}
          />
        </Col>
        <Col md={4}>
          <Form.Control
            type="date"
            className="dropdown-dark w-100"
            value={dateRange.to}
            onChange={(e: ChangeEvent<HTMLInputElement>) => 
              setDateRange((prev: DateRange) => ({ ...prev, to: e.target.value }))}
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="stats-card sales">
            <div className="icon">
              <i className="bi bi-currency-dollar"></i>
            </div>
            <h3>${data?.totalSales.toLocaleString()}</h3>
            <p className="text-muted mb-0">Total Sales</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card quantity">
            <div className="icon">
              <i className="bi bi-box"></i>
            </div>
            <h3>{data?.quantitySold}</h3>
            <p className="text-muted mb-0">Quantity Sold</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card discount">
            <div className="icon">
              <i className="bi bi-percent"></i>
            </div>
            <h3>{data?.discountPercentage}%</h3>
            <p className="text-muted mb-0">Discount%</p>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card profit">
            <div className="icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <h3>${data?.totalProfit.toLocaleString()}</h3>
            <p className="text-muted mb-0">Profit</p>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">Sales by City</h5>
            </Card.Header>
            <Card.Body>
              <ReactECharts option={cityChartOption} className="chart-container" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">Sales by Products</h5>
            </Card.Header>
            <Card.Body>
              <ReactECharts option={productsChartOption} className="chart-container" />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">Sales By Category</h5>
            </Card.Header>
            <Card.Body>
              <ReactECharts option={categoryChartOption} className="chart-container" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">Sales By Sub Category</h5>
            </Card.Header>
            <Card.Body>
              <ReactECharts option={subCategoryChartOption} className="chart-container" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="card-title mb-0">Sales By Segment</h5>
            </Card.Header>
            <Card.Body>
              <ReactECharts option={segmentChartOption} className="chart-container" />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 