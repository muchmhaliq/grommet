// (C) Copyright 2014 Hewlett-Packard Development Company, L.P.

var React = require('react');

function polarToCartesian (centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc (x, y, radius, startAngle, endAngle) {
  var start = polarToCartesian(x, y, radius, endAngle);
  var end = polarToCartesian(x, y, radius, startAngle);
  var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
  var d = [
      "M", start.x, start.y,
      "A", radius, radius, 0, arcSweep, 0, end.x, end.y
  ].join(" ");
  return d;
}

var Donut = React.createClass({

  propTypes: {
    legend: React.PropTypes.bool,
    series: React.PropTypes.arrayOf(React.PropTypes.shape({
      label: React.PropTypes.string,
      value: React.PropTypes.number,
      colorIndex: React.PropTypes.oneOfType([
        React.PropTypes.number, // 1-6
        React.PropTypes.string // status
      ]),
      onClick: React.PropTypes.func
    })).isRequired,
    units: React.PropTypes.string
  },

  _initialTimeout: function () {
    this.setState({initial: false, activeIndex: 0});
    clearTimeout(this._timeout);
  },

  _onMouseOver: function (index) {
    this.setState({initial: false, activeIndex: index});
  },

  _onMouseOut: function () {
    this.setState({initial: false, activeIndex: 0});
  },

  getInitialState: function() {
    return {
      initial: true,
      activeIndex: 0,
      legend: false
    };
  },

  componentDidMount: function() {
    this._timeout = setTimeout(this._initialTimeout, 10);
    this.setState({initial: true, activeIndex: 0});
  },

  componentWillUnmount: function() {
    clearTimeout(this._timeout);
    this._timeout = null;
  },

  _itemColorIndex: function (item, index) {
    return item.colorIndex || ('graph-' + (index + 1));
  },

  _renderLegend: function () {
    var total = 0;

    var legends = this.props.series.map(function (item, index) {
      var legendClasses = ["donut__legend-item"];
      if (this.state.activeIndex === index) {
        legendClasses.push("donut__legend-item--active");
      }
      var colorIndex = this._itemColorIndex(item, index);
      total += item.value;

      return(
        <li key={item.label} className={legendClasses.join(' ')}
          onMouseOver={this._onMouseOver.bind(this, index)}
          onMouseOut={this._onMouseOut.bind(this, index)}>
          <svg className={"donut__legend-item-swatch color-index-" + colorIndex}
            viewBox="0 0 12 12">
            <path className={item.className} d="M 5 0 l 0 12" />
          </svg>
          <span className="donut__legend-item-label">{item.label}</span>
          <span className="donut__legend-item-value">{item.value}</span>
          <span className="donut__legend-item-units">{this.props.units}</span>
        </li>
      );
    }, this);

    return (
      <ol className="donut__legend">
        {legends}
        <li className="donut__legend-total">
          <span className="donut__legend-total-label">Total</span>
          <span className="donut__legend-total-value">{total}</span>
          <span className="donut__legend-total-units">{this.props.units}</span>
        </li>
      </ol>
    );
  },

  render: function() {
    var total = 0;
    this.props.series.some(function (item) {
      total += item.value;
    });

    var startAngle = 0;
    var anglePer = 360.0 / total;
    var value = null;
    var units = null;
    var label = null;

    var paths = this.props.series.map(function (item, index) {

      var endAngle = Math.min(360, Math.max(10, startAngle + (anglePer * item.value)));
      var radius = (this.state.activeIndex === index) ? 78 : 72;
      var commands = describeArc(96, 96, radius, startAngle, endAngle-2);
      startAngle = endAngle;
      var colorIndex = this._itemColorIndex(item, index);

      var sliceClasses = ["donut__slice"];
      sliceClasses.push("color-index-" + colorIndex);
      if (this.state.activeIndex === index) {
        sliceClasses.push("donut__slice--active");
        value = item.value;
        units = item.units;
        label = item.label;
      }

      return(
        <path key={item.label} fill="none" className={sliceClasses.join(' ')} d={commands}
          onMouseOver={this._onMouseOver.bind(null, index)}
          onMouseOut={this._onMouseOut.bind(null, index)}
          onClick={item.onClick} />
      );
    }, this);

    var legend = null;
    if (this.props.legend) {
      legend = this._renderLegend();
    }

    return (
      <div className="donut">
        <div className="donut__graphic-container">
          <svg className="donut__graphic" viewBox="0 0 192 192"
            preserveAspectRatio="xMidYMid meet">
            <g>{paths}</g>
          </svg>
          <div className="donut__active">
            <div className="donut__active-value">
              {value}
              <span className="donut__active-units">{units}</span>
            </div>
            <div className="donut__active-label">{label}</div>
          </div>
        </div>
        {legend}
      </div>
    );
  }

});

module.exports = Donut;
